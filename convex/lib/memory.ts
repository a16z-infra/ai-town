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
import { asyncMap, getAll } from './utils.js';
import { getManyFrom, getManyVia, getOneFrom } from './relationships.js';
import { Memories } from '../schema.js';
import { chatGPTCompletion, fetchEmbedding, fetchEmbeddingBatch } from './openai.js';

const { embeddingId: _, ...MemoryWithoutEmbeddingId } = Memories.fields;
const NewMemory = { ...MemoryWithoutEmbeddingId, importance: v.optional(v.number()) };
const NewMemoryWithEmbedding = { ...MemoryWithoutEmbeddingId, embedding: v.array(v.number()) };
const NewMemoryObject = v.object(NewMemory);
type NewMemory = Infer<typeof NewMemoryObject>;

export interface MemoryDB {
  search(
    agentId: Id<'agents'>,
    vector: number[],
    ts: number,
    limit?: number,
  ): Promise<{ memory: Doc<'memories'>; score: number }[]>;
  accessMemories(
    agentId: Id<'agents'>,
    queryEmbedding: number[],
    ts: number,
    count?: number,
  ): Promise<{ memory: Doc<'memories'>; overallScore: number }[]>;
  addMemories(memories: NewMemory[]): Promise<Id<'memories'>[]>;
}

export function MemoryDB(ctx: ActionCtx): MemoryDB {
  // TODO: add pinecone option, if env variables are set

  return {
    // Finds memories but doesn't mark them as accessed.
    async search(agentId, queryEmbedding, ts, limit = 100) {
      const results = await ctx.vectorSearch('embeddings', 'embedding', {
        vector: queryEmbedding,
        vectorField: 'embedding',
        filter: (q) => q.eq('agentId', agentId),
        limit,
      });
      const embeddingIds = results.map((r) => r._id);
      const memories = await ctx.runQuery(internal.lib.memory.getMemories, {
        agentId,
        embeddingIds,
      });
      return results.map(({ score }, idx) => ({ memory: memories[idx], score }));
    },

    async accessMemories(agentId, queryEmbedding, ts, count = 10) {
      const results = await ctx.vectorSearch('embeddings', 'embedding', {
        vector: queryEmbedding,
        vectorField: 'embedding',
        filter: (q) => q.eq('agentId', agentId),
        limit: 10 * count,
      });
      return await ctx.runMutation(internal.lib.memory.accessMemories, {
        agentId,
        candidates: results,
        count,
        ts,
      });
    },

    async addMemories(memoriesWithoutEmbedding) {
      const cachedEmbeddings = await ctx.runQuery(internal.lib.memory.getEmbeddingsByText, {
        texts: memoriesWithoutEmbedding.map((memory) => memory.description),
      });
      const { embeddings: missingEmbeddings } = await fetchEmbeddingBatch(
        memoriesWithoutEmbedding
          .filter((memory, idx) => !cachedEmbeddings[idx])
          .map((memory) => memory.description),
      );
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
  args: { agentId: v.id('agents'), embeddingIds: v.array(v.id('embeddings')) },
  handler: async (ctx, args) => {
    return await asyncMap(args.embeddingIds, (id) =>
      getMemoryByEmbeddingId(ctx.db, args.agentId, id),
    );
  },
});

export const accessMemories = internalMutation({
  args: {
    agentId: v.id('agents'),
    candidates: v.array(v.object({ _id: v.id('embeddings'), score: v.number() })),
    count: v.number(),
    ts: v.number(),
  },
  handler: async (ctx, { agentId, candidates, count, ts }) => {
    const relatedMemories = await asyncMap(candidates, ({ _id }) =>
      getMemoryByEmbeddingId(ctx.db, agentId, _id),
    );
    // TODO: filter out old
    const recentMemories = await asyncMap(relatedMemories, (memory) =>
      getOneFrom(ctx.db, 'memoryAccesses', 'memoryId', memory._id),
    );
    // TODO: normalize ranges with min/max.
    const memoryScores = relatedMemories.map((memory, idx) => ({
      memory,
      overallScore:
        (candidates[idx].score + memory.importance + 0.99) ^
        Math.floor((ts - recentMemories[idx]!.ts) / 1000 / 60 / 60),
    }));
    memoryScores.sort((a, b) => b.overallScore - a.overallScore);
    const accessed = memoryScores.slice(0, count);
    await Promise.all(
      accessed.map(({ memory }) => ctx.db.insert('memoryAccesses', { ts, memoryId: memory._id })),
    );
    return accessed;
  },
});

export const embedMemory = internalAction({
  args: { memory: v.object(NewMemory) },
  handler: async (ctx, args): Promise<Id<'memories'>> => {
    return (await MemoryDB(ctx).addMemories([args.memory]))[0];
  },
});

export const embedMemories = internalAction({
  args: { memories: v.array(v.object(NewMemory)) },
  handler: async (ctx, args): Promise<Id<'memories'>[]> => {
    return await MemoryDB(ctx).addMemories(args.memories);
  },
});

export const addMemory = internalMutation({
  args: NewMemoryWithEmbedding,
  handler: async (ctx, args): Promise<Id<'memories'>> => {
    const { embedding, ...memory } = args;
    const { agentId, description: text } = memory;
    const embeddingId = await ctx.db.insert('embeddings', { agentId, embedding, text });
    return await ctx.db.insert('memories', { ...memory, embeddingId });
  },
});

export const addMemories = internalMutation({
  args: { memories: v.array(v.object(NewMemoryWithEmbedding)) },
  handler: async (ctx, args): Promise<Id<'memories'>[]> => {
    return asyncMap(args.memories, async (memoryWithEmbedding) => {
      const { embedding, ...memory } = memoryWithEmbedding;
      const { agentId, description: text } = memory;
      const embeddingId = await ctx.db.insert('embeddings', { agentId, embedding, text });
      return await ctx.db.insert('memories', { ...memory, embeddingId });
    });
  },
});

// Technically it's redundant to retrieve them by agentId, since the embedding
// is stored associated with an agentId already.
async function getMemoryByEmbeddingId(
  db: DatabaseReader,
  agentId: Id<'agents'>,
  embeddingId: Id<'embeddings'>,
) {
  const doc = await db
    .query('memories')
    .withIndex('by_agentId_embeddingId', (q) =>
      q.eq('agentId', agentId).eq('embeddingId', embeddingId),
    )
    .order('desc')
    .first();
  if (!doc) throw new Error(`No memory found for agent ${agentId} and embedding ${embeddingId}`);
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
