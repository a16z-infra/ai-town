import { defineTable } from 'convex/server';
import { v } from 'convex/values';
import { ActionCtx, DatabaseReader, internalMutation, internalQuery } from '../_generated/server';
import { Doc, Id } from '../_generated/dataModel';
import { internal } from '../_generated/api';
import { LLMMessage, chatCompletion, fetchEmbedding } from '../util/openai';
import { ACTION_TIMEOUT } from './constants';
import { asyncMap } from '../util/asyncMap';

// How long to wait before updating a memory's last access time.
export const MEMORY_ACCESS_THROTTLE = 300_000; // In ms
// We fetch 10x the number of memories by relevance, to have more candidates
// for sorting by relevance + recency + importance.
const MEMORY_OVERFETCH = 10;

const selfInternal = internal.agent.memory;

const memoryFields = {
  playerId: v.id('players'),
  description: v.string(),
  embeddingId: v.id('memoryEmbeddings'),
  importance: v.number(),
  lastAccess: v.number(),
  data: v.union(
    // Setting up dynamics between players
    v.object({
      type: v.literal('relationship'),
      // The player this memory is about, from the perspective of the player
      // whose memory this is.
      playerId: v.id('players'),
    }),
    v.object({
      type: v.literal('conversation'),
      conversationId: v.id('conversations'),
      // The other player(s) in the conversation.
      playerIds: v.array(v.id('players')),
    }),
    v.object({
      type: v.literal('reflection'),
      relatedMemoryIds: v.array(v.id('memories')),
    }),
  ),
};
export type Memory = Doc<'memories'>;
export type MemoryType = Memory['data']['type'];
export type MemoryOfType<T extends MemoryType> = Omit<Memory, 'data'> & {
  data: Extract<Memory['data'], { type: T }>;
};

export async function rememberConversation(
  ctx: ActionCtx,
  agentId: Id<'agents'>,
  generationNumber: number,
  playerId: Id<'players'>,
  conversationId: Id<'conversations'>,
) {
  const data = await ctx.runQuery(selfInternal.loadConversation, {
    playerId,
    conversationId,
  });
  const { player, otherPlayer } = data;
  const messages = await ctx.runQuery(selfInternal.loadMessages, { conversationId });
  if (!messages.length) {
    return;
  }
  const now = Date.now();

  // Set the `isThinking` flag and schedule a function to clear it after 60s. We'll
  // also clear the flag in `insertMemory` below to stop thinking early on success.
  await ctx.runMutation(selfInternal.startThinking, { agentId, now });
  const since = now;
  await ctx.scheduler.runAfter(ACTION_TIMEOUT, selfInternal.clearThinking, { agentId, since });

  const llmMessages: LLMMessage[] = [
    {
      role: 'user',
      content: `You are ${player.name}, and you just finished a conversation with ${otherPlayer.name}. I would
      like you to summarize the conversation from ${player.name}'s perspective, using first-person pronouns like
      "I," and add if you liked or disliked this interaction.`,
    },
  ];
  const authors = new Set<Id<'players'>>();
  for (const message of messages) {
    const author = message.author === player._id ? player : otherPlayer;
    authors.add(author._id);
    const recipient = message.author === player._id ? otherPlayer : player;
    llmMessages.push({
      role: 'user',
      content: `${author.name} to ${recipient.name}: ${message.text}`,
    });
  }
  llmMessages.push({ role: 'user', content: 'Summary:' });
  const { content } = await chatCompletion({
    messages: llmMessages,
    max_tokens: 500,
  });
  const description = `Conversation with ${otherPlayer.name} at ${new Date(
    data.conversation._creationTime,
  ).toLocaleString()}: ${content}`;
  const importance = await calculateImportance(description);
  const { embedding } = await fetchEmbedding(description);
  authors.delete(player._id);
  await ctx.runMutation(selfInternal.insertMemory, {
    agentId,
    generationNumber,

    playerId: player._id,
    description,
    importance,
    lastAccess: messages[messages.length - 1]._creationTime,
    data: {
      type: 'conversation',
      conversationId,
      playerIds: [...authors],
    },
    embedding,
  });
  await reflectOnMemories(ctx, agentId, generationNumber, playerId);
  await ctx.runMutation(selfInternal.clearThinking, { agentId, since });
  return description;
}

export const loadConversation = internalQuery({
  args: {
    playerId: v.id('players'),
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error(`Player ${args.playerId} not found`);
    }
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${args.conversationId} not found`);
    }
    const conversationMembers = await ctx.db
      .query('conversationMembers')
      .withIndex('conversationId', (q) => q.eq('conversationId', args.conversationId))
      .filter((q) => q.neq(q.field('playerId'), args.playerId))
      .collect();
    if (conversationMembers.length !== 1) {
      throw new Error(`Conversation ${args.conversationId} not with exactly one other player`);
    }
    const otherPlayer = await ctx.db.get(conversationMembers[0].playerId);
    if (!otherPlayer) {
      throw new Error(`Conversation ${args.conversationId} other player not found`);
    }
    return {
      player,
      conversation,
      otherPlayer,
    };
  },
});

export async function searchMemories(
  ctx: ActionCtx,
  player: Doc<'players'>,
  searchEmbedding: number[],
  n: number = 3,
) {
  const candidates = await ctx.vectorSearch('memoryEmbeddings', 'embedding', {
    vector: searchEmbedding,
    filter: (q) => q.eq('playerId', player._id),
    limit: n * MEMORY_OVERFETCH,
  });
  const rankedMemories = await ctx.runMutation(selfInternal.rankAndTouchMemories, {
    candidates,
    n,
  });
  return rankedMemories.map(({ memory }) => memory);
}

function makeRange(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return [min, max] as const;
}

function normalize(value: number, range: readonly [number, number]) {
  const [min, max] = range;
  return (value - min) / (max - min);
}

export const rankAndTouchMemories = internalMutation({
  args: {
    candidates: v.array(v.object({ _id: v.id('memoryEmbeddings'), _score: v.number() })),
    n: v.number(),
  },
  handler: async (ctx, args) => {
    const ts = Date.now();
    const relatedMemories = await asyncMap(args.candidates, async ({ _id }) => {
      const memory = await ctx.db
        .query('memories')
        .withIndex('embeddingId', (q) => q.eq('embeddingId', _id))
        .first();
      if (!memory) throw new Error(`Memory for embedding ${_id} not found`);
      return memory;
    });

    // TODO: fetch <count> recent memories and <count> important memories
    // so we don't miss them in case they were a little less relevant.
    const recencyScore = relatedMemories.map((memory) => {
      const hoursSinceAccess = (ts - memory.lastAccess) / 1000 / 60 / 60;
      return 0.99 ** Math.floor(hoursSinceAccess);
    });
    const relevanceRange = makeRange(args.candidates.map((c) => c._score));
    const importanceRange = makeRange(relatedMemories.map((m) => m.importance));
    const recencyRange = makeRange(recencyScore);
    const memoryScores = relatedMemories.map((memory, idx) => ({
      memory,
      overallScore:
        normalize(args.candidates[idx]._score, relevanceRange) +
        normalize(memory.importance, importanceRange) +
        normalize(recencyScore[idx], recencyRange),
    }));
    memoryScores.sort((a, b) => b.overallScore - a.overallScore);
    const accessed = memoryScores.slice(0, args.n);
    await asyncMap(accessed, async ({ memory }) => {
      if (memory.lastAccess < ts - MEMORY_ACCESS_THROTTLE) {
        await ctx.db.patch(memory._id, { lastAccess: ts });
      }
    });
    return accessed;
  },
});

export const loadMessages = internalQuery({
  args: {
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query('messages')
      .withIndex('conversationId', (q) => q.eq('conversationId', args.conversationId))
      .collect();
    return messages;
  },
});

async function calculateImportance(description: string) {
  const { content: importanceRaw } = await chatCompletion({
    messages: [
      {
        role: 'user',
        content: `On the scale of 0 to 9, where 0 is purely mundane (e.g., brushing teeth, making bed) and 9 is extremely poignant (e.g., a break up, college acceptance), rate the likely poignancy of the following piece of memory.
        Memory: ${description}
        Answer on a scale of 0 to 9. Respond with number only, e.g. "5"`,
      },
    ],
    temperature: 0.0,
    max_tokens: 1,
  });

  let importance = parseFloat(importanceRaw);
  if (isNaN(importance)) {
    importance = +(importanceRaw.match(/\d+/)?.[0] ?? NaN);
  }
  if (isNaN(importance)) {
    console.debug('Could not parse memory importance from: ', importanceRaw);
    importance = 5;
  }
  return importance;
}

const { embeddingId, ...memoryFieldsWithoutEmbeddingId } = memoryFields;
export const startThinking = internalMutation({
  args: {
    agentId: v.id('agents'),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.agentId, { isThinking: { since: args.now } });
  },
});

export const clearThinking = internalMutation({
  args: {
    agentId: v.id('agents'),
    since: v.number(),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      throw new Error(`Agent ${args.agentId} not found`);
    }
    if (!agent.isThinking) {
      return;
    }
    if (agent.isThinking.since !== args.since) {
      return;
    }
    await ctx.db.patch(args.agentId, { isThinking: undefined });
  },
});

export const insertMemory = internalMutation({
  args: {
    agentId: v.id('agents'),
    generationNumber: v.number(),

    embedding: v.array(v.float64()),
    ...memoryFieldsWithoutEmbeddingId,
  },
  handler: async (ctx, { agentId, generationNumber, embedding, ...memory }) => {
    const agent = await ctx.db.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    if (agent.generationNumber !== generationNumber) {
      throw new Error(
        `Agent ${agentId} generation number ${agent.generationNumber} does not match ${generationNumber}`,
      );
    }
    const embeddingId = await ctx.db.insert('memoryEmbeddings', {
      playerId: memory.playerId,
      embedding: embedding,
    });
    await ctx.db.insert('memories', {
      ...memory,
      embeddingId,
    });
  },
});

export const insertReflectionMemories = internalMutation({
  args: {
    agentId: v.id('agents'),
    generationNumber: v.number(),

    reflections: v.array(
      v.object({
        description: v.string(),
        relatedMemoryIds: v.array(v.id('memories')),
        importance: v.number(),
        embedding: v.array(v.float64()),
      }),
    ),
  },
  handler: async (ctx, { agentId, generationNumber, reflections }) => {
    const agent = await ctx.db.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    if (agent.generationNumber !== generationNumber) {
      throw new Error(
        `Agent ${agentId} generation number ${agent.generationNumber} does not match ${generationNumber}`,
      );
    }
    const lastAccess = Date.now();
    for (const { embedding, relatedMemoryIds, ...rest } of reflections) {
      const embeddingId = await ctx.db.insert('memoryEmbeddings', {
        playerId: agent.playerId,
        embedding: embedding,
      });
      await ctx.db.insert('memories', {
        playerId: agent.playerId,
        embeddingId,
        lastAccess,
        ...rest,
        data: {
          type: 'reflection',
          relatedMemoryIds,
        },
      });
    }
  },
});

async function reflectOnMemories(
  ctx: ActionCtx,
  agentId: Id<'agents'>,
  generationNumber: number,
  playerId: Id<'players'>,
) {
  const { memories, lastReflectionTs, name } = await ctx.runQuery(
    internal.agent.memory.getReflectionMemories,
    {
      playerId,
      numberOfItems: 100,
    },
  );

  // should only reflect if lastest 100 items have importance score of >500
  const sumOfImportanceScore = memories
    .filter((m) => m._creationTime > (lastReflectionTs ?? 0))
    .reduce((acc, curr) => acc + curr.importance, 0);
  const shouldReflect = sumOfImportanceScore > 500;

  if (!shouldReflect) {
    return false;
  }
  console.debug('sum of importance score = ', sumOfImportanceScore);
  console.debug('Reflecting...');
  const prompt = ['[no prose]', '[Output only JSON]', `You are ${name}, statements about you:`];
  memories.forEach((m, idx) => {
    prompt.push(`Statement ${idx}: ${m.description}`);
  });
  prompt.push('What 3 high-level insights can you infer from the above statements?');
  prompt.push(
    'Return in JSON format, where the key is a list of input statements that contributed to your insights and value is your insight. Make the response parseable by Typescript JSON.parse() function. DO NOT escape characters or include "\n" or white space in response.',
  );
  prompt.push(
    'Example: [{insight: "...", statementIds: [1,2]}, {insight: "...", statementIds: [1]}, ...]',
  );

  const { content: reflection } = await chatCompletion({
    messages: [
      {
        role: 'user',
        content: prompt.join('\n'),
      },
    ],
  });

  try {
    const insights: { insight: string; statementIds: number[] }[] = JSON.parse(reflection);
    const memoriesToSave = await asyncMap(insights, async (item) => {
      const relatedMemoryIds = item.statementIds.map((idx: number) => memories[idx]._id);
      const importance = await calculateImportance(item.insight);
      const { embedding } = await fetchEmbedding(item.insight);
      console.debug('adding reflection memory...', item.insight);
      return {
        description: item.insight,
        embedding,
        importance,
        relatedMemoryIds,
      };
    });

    await ctx.runMutation(selfInternal.insertReflectionMemories, {
      agentId,
      generationNumber,
      reflections: memoriesToSave,
    });
  } catch (e) {
    console.error('error saving or parsing reflection', e);
    console.debug('reflection', reflection);
    return false;
  }
  return true;
}
export const getReflectionMemories = internalQuery({
  args: { playerId: v.id('players'), numberOfItems: v.number() },
  handler: async (
    ctx,
    { playerId, numberOfItems },
  ): Promise<{ memories: Doc<'memories'>[]; lastReflectionTs?: number; name: string }> => {
    const player = await ctx.db.get(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }
    const memories = await ctx.db
      .query('memories')
      .withIndex('playerId', (q) => q.eq('playerId', playerId))
      .order('desc')
      .take(numberOfItems);

    const lastReflection = await ctx.db
      .query('memories')
      .withIndex('playerId_type', (q) => q.eq('playerId', playerId).eq('data.type', 'reflection'))
      .order('desc')
      .first();

    return {
      name: player.name,
      memories,
      lastReflectionTs: lastReflection?._creationTime,
    };
  },
});

export async function latestMemoryOfType<T extends MemoryType>(
  db: DatabaseReader,
  playerId: Id<'players'>,
  type: T,
) {
  const entry = await db
    .query('memories')
    .withIndex('playerId_type', (q) => q.eq('playerId', playerId).eq('data.type', type))
    .order('desc')
    .first();
  if (!entry) return null;
  return entry as MemoryOfType<T>;
}

export const memoryTables = {
  memories: defineTable(memoryFields)
    .index('embeddingId', ['embeddingId'])
    .index('playerId_type', ['playerId', 'data.type'])
    .index('playerId', ['playerId']),
  memoryEmbeddings: defineTable({
    playerId: v.id('players'),
    embedding: v.array(v.float64()),
  }).vectorIndex('embedding', {
    vectorField: 'embedding',
    filterFields: ['playerId'],
    dimensions: 1536,
  }),
};
