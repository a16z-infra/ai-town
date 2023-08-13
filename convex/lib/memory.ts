import { Infer, v } from 'convex/values';
import { internal } from '../_generated/api.js';
import { Doc, Id } from '../_generated/dataModel.js';
import {
  ActionCtx,
  DatabaseReader,
  internalMutation,
  internalQuery,
} from '../_generated/server.js';
import { asyncMap } from './utils.js';
import { EntryOfType, Memories, Memory, MemoryOfType, MemoryType } from '../schema.js';
import { chatCompletion } from './openai.js';
import { clientMessageMapper } from '../chat.js';
import { pineconeAvailable, queryVectors, upsertVectors } from './pinecone.js';
import { chatHistoryFromMessages } from '../conversation.js';
import { MEMORY_ACCESS_THROTTLE } from '../config.js';
import { fetchEmbeddingBatchWithCache } from './cached_llm.js';

const { embeddingId: _, lastAccess, ...MemoryWithoutEmbeddingId } = Memories.fields;
const NewMemory = { ...MemoryWithoutEmbeddingId, importance: v.optional(v.number()) };
const NewMemoryWithEmbedding = { ...MemoryWithoutEmbeddingId, embedding: v.array(v.number()) };
const NewMemoryObject = v.object(NewMemory);
type NewMemory = Infer<typeof NewMemoryObject>;

export interface MemoryDB {
  search(
    playerId: Id<'players'>,
    vector: number[],
    limit?: number,
  ): Promise<{ memory: Doc<'memories'>; score: number }[]>;
  accessMemories(
    playerId: Id<'players'>,
    queryEmbedding: number[],
    count?: number,
  ): Promise<{ memory: Doc<'memories'>; overallScore: number }[]>;
  addMemories(memories: NewMemory[]): Promise<void>;
  rememberConversation(
    playerName: string,
    playerId: Id<'players'>,
    playerIdentity: string,
    conversationId: Id<'conversations'>,
  ): Promise<boolean>;
  reflectOnMemories(playerId: Id<'players'>, name: string): Promise<void>;
}

export function MemoryDB(ctx: ActionCtx): MemoryDB {
  if (!pineconeAvailable()) {
    throw new Error('Pinecone environment variables not set. See the README.');
  }
  // If Pinecone env variables are defined, use that.
  const vectorSearch = async (embedding: number[], playerId: Id<'players'>, limit: number) =>
    queryVectors('embeddings', embedding, { playerId }, limit);
  const externalEmbeddingStore = async (
    embeddings: { id: Id<'embeddings'>; values: number[]; metadata: object }[],
  ) => upsertVectors('embeddings', embeddings);

  return {
    // Finds memories but doesn't mark them as accessed.
    async search(playerId, queryEmbedding, limit = 100) {
      const results = await vectorSearch(queryEmbedding, playerId, limit);
      const embeddingIds = results.map((r) => r._id);
      const memories = await ctx.runQuery(internal.lib.memory.getMemories, {
        playerId,
        embeddingIds,
      });
      return results.map(({ score }, idx) => ({ memory: memories[idx], score }));
    },

    async accessMemories(playerId, queryEmbedding, count = 10) {
      const results = await vectorSearch(queryEmbedding, playerId, 10 * count);
      return await ctx.runMutation(internal.lib.memory.accessMemories, {
        playerId,
        candidates: results,
        count,
      });
    },

    async addMemories(memoriesWithoutEmbedding) {
      const texts = memoriesWithoutEmbedding.map((memory) => memory.description);
      const { embeddings } = await fetchEmbeddingBatchWithCache(ctx, texts);
      // NB: The cache gets populated by addMemories, so no need to do it here.

      const memories = await asyncMap(memoriesWithoutEmbedding, async (memory, idx) => {
        const embedding = embeddings[idx];

        if (memory.importance === undefined) {
          // TODO: make a better prompt based on the user's memories
          const { content: importanceRaw } = await chatCompletion({
            messages: [
              { role: 'user', content: memory.description },
              {
                role: 'user',
                content:
                  'How important is this? Answer on a scale of 0 to 9. Respond with number only, e.g. "5"',
              },
            ],
            max_tokens: 1,
          });
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
          return { ...memory, embedding, importance };
        } else {
          return { ...memory, embedding, importance: memory.importance };
        }
      });
      const embeddingIds = await ctx.runMutation(internal.lib.memory.addMemories, { memories });
      if (externalEmbeddingStore) {
        await externalEmbeddingStore(
          embeddingIds.map((id, idx) => ({
            id,
            values: embeddings[idx],
            metadata: { playerId: memories[idx].playerId },
          })),
        );
      }
    },

    async rememberConversation(playerName, playerId, playerIdentity, conversationId) {
      const messages = await ctx.runQuery(internal.lib.memory.getRecentMessages, {
        playerId,
        conversationId,
      });
      if (!messages.length) return false;
      const { content: description } = await chatCompletion({
        messages: [
          {
            role: 'user',
            content: `The following are messages. You are ${playerName}, and ${playerIdentity}
            I would like you to summarize the conversation in a paragraph from your perspective. Add if you like or dislike this interaction.`,
          },
          ...chatHistoryFromMessages(messages),
          {
            role: 'user',
            content: `Summary:`,
          },
        ],
        max_tokens: 500,
      });
      await this.addMemories([
        {
          playerId,
          description,
          data: {
            type: 'conversation',
            conversationId,
          },
        },
      ]);
      return true;
    },
    async reflectOnMemories(playerId: Id<'players'>, name: string) {
      const { memories, lastReflectionTs } = await ctx.runQuery(
        internal.lib.memory.getReflectionMemories,
        {
          playerId,
          numberOfItems: 100,
        },
      );

      // should only reflect if lastest 100 items have importance score of >500
      const sumOfImportanceScore = memories
        .filter((m) => m._creationTime > (lastReflectionTs ?? 0))
        .reduce((acc, curr) => acc + curr.importance, 0);
      console.debug('sum of importance score = ', sumOfImportanceScore);
      const shouldReflect = sumOfImportanceScore > 500;

      if (shouldReflect) {
        console.debug('Reflecting...');
        let prompt = `[no prose]\n [Output only JSON] \nYou are ${name}, statements about you:\n`;
        memories.forEach((m, idx) => {
          prompt += `Statement ${idx}: ${m.description}\n`;
        });
        prompt += `What 3 high-level insights can you infer from the above statements?
        Return in JSON format, where the key is a list of input statements that contributed to your insights and value is your insight. Make the response parseable by Typescript JSON.parse() function. DO NOT escape characters or include '\n' or white space in response.
          Example: [{insight: "...", statementIds: [1,2]}, {insight: "...", statementIds: [1]}, ...]`;

        const { content: reflection } = await chatCompletion({
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        });

        try {
          const insights: { insight: string; statementIds: number[] }[] = JSON.parse(reflection);
          let memoriesToSave: MemoryOfType<'reflection'>[] = [];
          insights.forEach((item) => {
            const relatedMemoryIds = item.statementIds.map((idx: number) => memories[idx]._id);
            const reflectionMemory = {
              playerId,
              description: item.insight,
              data: {
                type: 'reflection',
                relatedMemoryIds,
              },
            } as MemoryOfType<'reflection'>;
            memoriesToSave.push(reflectionMemory);
          });
          console.debug('adding reflection memory...', memoriesToSave);

          await this.addMemories(memoriesToSave);
        } catch (e) {
          console.error('error saving or parseing reflection', e);
          console.debug('reflection', reflection);
          return;
        }
      }
    },
  };
}

export const filterMemoriesType = <T extends MemoryType>(
  memoryTypes: T[],
  memories: { memory: Doc<'memories'>; overallScore: number }[],
) => {
  return memories.filter((m) => {
    return memoryTypes.includes(m.memory.data.type as T);
  }) as { memory: MemoryOfType<T>; overallScore: number }[];
};

export const getMemories = internalQuery({
  args: { playerId: v.id('players'), embeddingIds: v.array(v.id('embeddings')) },
  handler: async (ctx, args): Promise<Memory[]> => {
    return await asyncMap(args.embeddingIds, (id) =>
      getMemoryByEmbeddingId(ctx.db, args.playerId, id),
    );
  },
});

export const accessMemories = internalMutation({
  args: {
    playerId: v.id('players'),
    candidates: v.array(v.object({ _id: v.id('embeddings'), score: v.number() })),
    count: v.number(),
  },
  handler: async (ctx, { playerId, candidates, count }) => {
    const ts = Date.now();
    const relatedMemories = await asyncMap(candidates, ({ _id }) =>
      getMemoryByEmbeddingId(ctx.db, playerId, _id),
    );
    // TODO: fetch <count> recent memories and <count> important memories
    // so we don't miss them in case they were a little less relevant.
    const recencyScore = relatedMemories.map((memory) => {
      return 0.99 ^ Math.floor((ts - memory.lastAccess) / 1000 / 60 / 60);
    });
    const relevanceRange = makeRange(candidates.map((c) => c.score));
    const importanceRange = makeRange(relatedMemories.map((m) => m.importance));
    const recencyRange = makeRange(recencyScore);
    const memoryScores = relatedMemories.map((memory, idx) => ({
      memory,
      overallScore:
        normalize(candidates[idx].score, relevanceRange) +
        normalize(memory.importance, importanceRange) +
        normalize(recencyScore[idx], recencyRange),
    }));
    memoryScores.sort((a, b) => b.overallScore - a.overallScore);
    const accessed = memoryScores.slice(0, count);
    await asyncMap(accessed, async ({ memory }) => {
      if (memory.lastAccess < ts - MEMORY_ACCESS_THROTTLE) {
        await ctx.db.patch(memory._id, { lastAccess: ts });
      }
    });
    return accessed;
  },
});

function normalize(value: number, range: readonly [number, number]) {
  const [min, max] = range;
  return (value - min) / (max - min);
}

function makeRange(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return [min, max] as const;
}

// Unused, but in case they're helpful later.
// export const embedMemory = internalAction({
//   args: { memory: v.object(NewMemory) },
//   handler: async (ctx, args): Promise<Id<'memories'>> => {
//     return (await MemoryDB(ctx).addMemories([args.memory]))[0];
//   },
// });

// export const embedMemories = internalAction({
//   args: { memories: v.array(v.object(NewMemory)) },
//   handler: async (ctx, args): Promise<Id<'memories'>[]> => {
//     return await MemoryDB(ctx).addMemories(args.memories);
//   },
// });

// export const addMemory = internalMutation({
//   args: NewMemoryWithEmbedding,
//   handler: async (ctx, args): Promise<Id<'memories'>> => {
//     const { embedding, ...memory } = args;
//     const { playerId, description: text } = memory;
//     const embeddingId = await ctx.db.insert('embeddings', { playerId, embedding, text });
//     return await ctx.db.insert('memories', { ...memory, embeddingId });
//   },
// });

export const addMemories = internalMutation({
  args: { memories: v.array(v.object(NewMemoryWithEmbedding)) },
  handler: async (ctx, args): Promise<Id<'embeddings'>[]> => {
    return asyncMap(args.memories, async (memoryWithEmbedding) => {
      const { embedding, ...memory } = memoryWithEmbedding;
      const { playerId, description: text } = memory;
      const embeddingId = await ctx.db.insert('embeddings', { playerId, embedding, text });
      await ctx.db.insert('memories', { ...memory, lastAccess: Date.now(), embeddingId });
      return embeddingId;
    });
  },
});

// Technically it's redundant to retrieve them by playerId, since the embedding
// is stored associated with an playerId already.
async function getMemoryByEmbeddingId(
  db: DatabaseReader,
  playerId: Id<'players'>,
  embeddingId: Id<'embeddings'>,
) {
  const doc = await db
    .query('memories')
    .withIndex('by_playerId_embeddingId', (q) =>
      q.eq('playerId', playerId).eq('embeddingId', embeddingId),
    )
    .order('desc')
    .first();
  if (!doc) throw new Error(`No memory found for player ${playerId} and embedding ${embeddingId}`);
  return doc;
}

export const getReflectionMemories = internalQuery({
  args: { playerId: v.id('players'), numberOfItems: v.number() },
  handler: async (ctx, { playerId, numberOfItems }) => {
    const conversations = await ctx.db
      .query('memories')
      .withIndex('by_playerId_type', (q) =>
        //TODO - we should get memories of other types once we can
        // Probably with an index just on playerId, so we can sort by time
        q.eq('playerId', playerId).eq('data.type', 'conversation'),
      )
      .order('desc')
      .take(numberOfItems);
    console.debug('conversation memories lenth', conversations.length);
    const reflections = await ctx.db
      .query('memories')
      .withIndex('by_playerId_type', (q) =>
        q.eq('playerId', playerId).eq('data.type', 'reflection'),
      )
      .order('desc')
      .take(numberOfItems);

    const lastReflection = await ctx.db
      .query('memories')
      .withIndex('by_playerId_type', (q) =>
        q.eq('playerId', playerId).eq('data.type', 'reflection'),
      )
      .order('desc')
      .first();
    const mergedList = reflections.concat(conversations);
    mergedList.sort((a, b) => b._creationTime - a._creationTime);

    return {
      memories: mergedList.slice(0, numberOfItems),
      lastReflectionTs: lastReflection?._creationTime,
    };
  },
});

export const getRecentMessages = internalQuery({
  args: {
    playerId: v.id('players'),
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, { playerId, conversationId }) => {
    // Fetch the first message to bound the search for the last memory.
    // Only a slight optimization for memory search, which might scan to the
    // beginning of time (for this user's conversations).
    const firstMessage = (await ctx.db
      .query('journal')
      .withIndex('by_conversation', (q) => q.eq('data.conversationId', conversationId as any))
      .first()) as EntryOfType<'talking'>;

    // Look for the last conversation memory for this conversation
    // Only need to check from when the first message exists.
    const lastConversationMemory = (await ctx.db
      .query('memories')
      .withIndex('by_playerId_type', (q) =>
        q
          .eq('playerId', playerId)
          .eq('data.type', 'conversation')
          .gt('_creationTime', firstMessage._creationTime),
      )
      .order('desc')
      .filter((q) => q.eq(q.field('data.conversationId'), conversationId))
      .first()) as MemoryOfType<'conversation'> | null;

    const allMessages = (await ctx.db
      .query('journal')
      .withIndex('by_conversation', (q) => {
        const q2 = q.eq('data.conversationId', conversationId as any);
        if (lastConversationMemory) {
          // If we have a memory of this conversation, only look at messages after.
          return q2.gt('_creationTime', lastConversationMemory._creationTime);
        }
        return q2;
      })
      .filter((q) => q.eq(q.field('data.type'), 'talking'))
      .collect()) as EntryOfType<'talking'>[];
    return (await asyncMap(allMessages, clientMessageMapper(ctx.db))).filter(
      (m) => m.from === playerId || m.to.includes(playerId),
    );
  },
});
