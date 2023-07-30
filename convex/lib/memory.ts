import { Infer, v } from 'convex/values';
import { api, internal } from '../_generated/api.js';
import { Doc, Id } from '../_generated/dataModel.js';
import {
  ActionCtx,
  DatabaseReader,
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from '../_generated/server.js';
import { asyncMap } from './utils.js';
import { Memories } from '../schema.js';
import { chatGPTCompletion, fetchEmbeddingBatch } from './openai.js';

const { embeddingId: _, ...MemoryWithoutEmbeddingId } = Memories.fields;
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
  addMemories(memories: NewMemory[]): Promise<Id<'memories'>[]>;
}

export function MemoryDB(ctx: ActionCtx): MemoryDB {
  // TODO: add pinecone option, if env variables are set

  return {
    // Finds memories but doesn't mark them as accessed.
    async search(playerId, queryEmbedding, limit = 100) {
      const results = await ctx.vectorSearch('embeddings', 'embedding', {
        vector: queryEmbedding,
        vectorField: 'embedding',
        filter: (q) => q.eq('playerId', playerId),
        limit,
      });
      const embeddingIds = results.map((r) => r._id);
      const memories = await ctx.runQuery(internal.lib.memory.getMemories, {
        playerId,
        embeddingIds,
      });
      return results.map(({ score }, idx) => ({ memory: memories[idx], score }));
    },

    async accessMemories(playerId, queryEmbedding, count = 10) {
      const results = await ctx.vectorSearch('embeddings', 'embedding', {
        vector: queryEmbedding,
        vectorField: 'embedding',
        filter: (q) => q.eq('playerId', playerId),
        limit: 10 * count,
      });
      return await ctx.runMutation(internal.lib.memory.accessMemories, {
        playerId,
        candidates: results,
        count,
      });
    },

    async addMemories(memoriesWithoutEmbedding) {
      const cachedEmbeddings = await ctx.runQuery(internal.lib.memory.getEmbeddingsByText, {
        texts: memoriesWithoutEmbedding.map((memory) => memory.description),
      });
      const cacheMisses = memoriesWithoutEmbedding
        .filter((memory, idx) => !cachedEmbeddings[idx])
        .map((memory) => memory.description);
      const { embeddings: missingEmbeddings } = cacheMisses.length
        ? await fetchEmbeddingBatch(cacheMisses)
        : { embeddings: [] };
      // NB: The cache gets populated by addMemories, so no need to do it here.
      missingEmbeddings.reverse();
      // Swap the cache misses with calculated embeddings
      const embeddings = cachedEmbeddings.map((cached) => cached || missingEmbeddings.pop()!);

      const memories = await asyncMap(memoriesWithoutEmbedding, async (memory, idx) => {
        const embedding = embeddings[idx];

        if (memory.importance === undefined) {
          // TODO: make a better prompt based on the user's memories
          const { content: importanceRaw } = await chatGPTCompletion([
            { role: 'user', content: memory.description },
            {
              role: 'user',
              content: 'How important is this? Answer on a scale of 0-10. Respond like: 5',
            },
          ]);
          let importance = 5;
          try {
            importance = parseFloat(importanceRaw);
          } catch (e) {
            console.log('failed to parse importance', e);
          }
          return { ...memory, embedding, importance };
        } else {
          return { ...memory, embedding, importance: memory.importance };
        }
      });
      return ctx.runMutation(internal.lib.memory.addMemories, { memories });
    },
  };
}

export const getMemories = internalQuery({
  args: { playerId: v.id('players'), embeddingIds: v.array(v.id('embeddings')) },
  handler: async (ctx, args) => {
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
    const recencyScore = await asyncMap(relatedMemories, async (memory) => {
      const access = await ctx.db
        .query('memoryAccesses')
        .withIndex('by_memoryId', (q) => q.eq('memoryId', memory._id))
        .order('desc')
        .first();
      if (!access) return 1;
      return 0.99 ^ Math.floor((ts - access._creationTime) / 1000 / 60 / 60);
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
    await Promise.all(
      accessed.map(({ memory }) => ctx.db.insert('memoryAccesses', { memoryId: memory._id })),
    );
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
  handler: async (ctx, args): Promise<Id<'memories'>[]> => {
    return asyncMap(args.memories, async (memoryWithEmbedding) => {
      const { embedding, ...memory } = memoryWithEmbedding;
      const { playerId, description: text } = memory;
      const embeddingId = await ctx.db.insert('embeddings', { playerId, embedding, text });
      return await ctx.db.insert('memories', { ...memory, embeddingId });
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

export async function checkEmbeddingCache(db: DatabaseReader, texts: string[]) {
  return asyncMap(texts, async (text) => {
    const existing = await db
      .query('embeddings')
      .withIndex('by_text', (q) => q.eq('text', text))
      .first();
    if (existing) return existing.embedding;
    return null;
  });
}

export const getEmbeddingsByText = internalQuery({
  args: { texts: v.array(v.string()) },
  handler: async (ctx, args) => {
    return checkEmbeddingCache(ctx.db, args.texts);
  },
});
