import { Infer, v } from 'convex/values';
import { api, internal } from '../_generated/api.js';
import { Doc, Id } from '../_generated/dataModel.js';
import {
  ActionCtx,
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from '../_generated/server.js';
import { asyncMap, getAll } from './utils.js';
import { getManyFrom, getManyVia, getOneFrom } from './relationships.js';
import { Memories, ts } from '../schema.js';

const { embeddingId: _, ...withoutEmbeddingId } = Memories.fields;
const newMemoryValidator = { ...withoutEmbeddingId, embedding: v.array(v.number()) };
const newMemoryObject = v.object(newMemoryValidator);
type NewMemory = Infer<typeof newMemoryObject>;

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
  addMemory(memory: NewMemory): Promise<Id<'memories'>>;
}

export const getMemories = internalQuery({
  args: { memoryIds: v.array(v.id('embeddings')) },
  handler: async (ctx, args) => {
    return await asyncMap(args.memoryIds, (id) =>
      getOneFrom(ctx.db, 'memories', 'embeddingId', id),
    );
  },
});

export const accessMemories = internalMutation({
  args: {
    // agentId: v.id('agents'),
    candidates: v.array(v.object({ _id: v.id('embeddings'), score: v.number() })),
    count: v.number(),
    ts: v.number(),
  },
  handler: async (ctx, { candidates, count, ts }) => {
    const relatedMemories = await asyncMap(candidates, ({ _id }) =>
      getOneFrom(ctx.db, 'memories', 'embeddingId', _id),
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

export const addMemory = internalMutation({
  args: { ...newMemoryValidator, ts },
  handler: async (ctx, args) => {
    const { agentId, embedding, ...memory } = args;
    // TODO: check embedding cache
    const embeddingId = await ctx.db.insert('embeddings', { agentId, embedding });
    return await ctx.db.insert('memories', { ...memory, agentId, embeddingId });
  },
});

export function memoryDB(ctx: ActionCtx): MemoryDB {
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
      const memoryIds = results.map((r) => r._id);
      const memories = await ctx.runQuery(internal.lib.memory.getMemories, { memoryIds });
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
        // agentId,
        candidates: results,
        count,
        ts,
      });
    },

    async addMemory(memory) {
      return ctx.runMutation(internal.lib.memory.addMemory, memory);
    },
  };
}
