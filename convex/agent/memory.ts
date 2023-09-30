import { defineTable } from 'convex/server';
import { v } from 'convex/values';
import { ActionCtx, DatabaseReader, internalMutation, internalQuery } from '../_generated/server';
import { Doc, Id } from '../_generated/dataModel';
import { internal } from '../_generated/api';
import { LLMMessage, chatCompletion, fetchEmbedding } from '../util/openai';
import * as embeddingsCache from './embeddingsCache';

const selfInternal = internal.agent.memory;

const memoryFields = {
  playerId: v.id('players'),
  description: v.string(),
  embeddingId: v.id('memoryEmbeddings'),
  importance: v.number(),
  lastAccess: v.number(),
  data: v.union(
    // Useful for seed memories, high level goals
    // Setting up dynamics between players
    v.object({
      type: v.literal('relationship'),
      playerId: v.id('players'),
    }),
    // Per-agent summary of recent observations
    // Can start out all the same, but could be dependent on personality
    v.object({
      type: v.literal('conversation'),
      conversationId: v.id('conversations'),
    }),

    // Exercises left to the reader:

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
  const llmMessages: LLMMessage[] = [
    {
      role: 'user',
      content: `You are ${player.name}, and you just finished a conversation with ${otherPlayer.name}. I would
      like you to summarize the conversation from ${player.name}'s perspective, using first-person pronouns like
      "I," and add if you liked or disliked this interaction.`,
    },
  ];
  for (const message of messages) {
    const author = message.author === player._id ? player : otherPlayer;
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
  ).toLocaleString()}: ${await content.readAll()}`;
  const importance = await calculateImportance(player, description);
  const { embedding } = await fetchEmbedding(description);
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
    },
    embedding,
  });
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

export async function queryOpinionAboutPlayer(
  ctx: ActionCtx,
  player: Doc<'players'>,
  otherPlayer: Doc<'players'>,
) {
  const embedding = await embeddingsCache.fetch(
    ctx,
    `What do you think about ${otherPlayer.name}?`,
  );
  const results = await ctx.vectorSearch('memoryEmbeddings', 'embedding', {
    vector: embedding,
    filter: (q) => q.eq('playerId', player._id),
    limit: 3,
  });
  const summaries = await ctx.runQuery(selfInternal.loadMemories, {
    embeddingIds: results.map((r) => r._id),
  });
  return summaries;
}

export const loadMemories = internalQuery({
  args: {
    embeddingIds: v.array(v.id('memoryEmbeddings')),
  },
  handler: async (ctx, args) => {
    const out = [];
    for (const embeddingId of args.embeddingIds) {
      const memory = await ctx.db
        .query('memories')
        .withIndex('embeddingId', (q) => q.eq('embeddingId', embeddingId))
        .first();
      if (!memory) {
        throw new Error(`Memory with embedding ${embeddingId} not found`);
      }
      out.push(memory.description);
    }
    return out;
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

async function calculateImportance(player: Doc<'players'>, description: string) {
  // TODO: make a better prompt based on the user's memories
  const { content } = await chatCompletion({
    messages: [
      // {
      //   role: 'user',
      //   content: `You are ${player.name}. Here's a little about you:
      //         ${player.description}

      //         Now I'm going to give you a description of a memory to gauge the importance of.`,
      // },
      {
        role: 'user',
        content: `On the scale of 0 to 9, where 0 is purely mundane (e.g., brushing teeth, making bed) and 9 is extremely poignant (e.g., a break up, college acceptance), rate the likely poignancy of the following piece of memory.
        Memory: ${description}
        Rating: <fill in>`,
      },
    ],
    max_tokens: 1,
  });
  const importanceRaw = await content.readAll();
  let importance = NaN;
  for (let i = 0; i < importanceRaw.length; i++) {
    const number = parseInt(importanceRaw[i]);
    if (!isNaN(number)) {
      importance = number;
      break;
    }
  }
  importance = parseFloat(importanceRaw);
  if (isNaN(importance)) {
    console.debug('importance is NaN', importanceRaw);
    importance = 5;
  }
  return importance;
}

const { embeddingId, ...memoryFieldsWithoutEmbeddingId } = memoryFields;

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
