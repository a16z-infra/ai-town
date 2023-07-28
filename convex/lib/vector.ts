import { v } from 'convex/values';
import { api, internal } from '../_generated/api.js';
import { Doc, Id } from '../_generated/dataModel';
import {
  ActionCtx,
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from '../_generated/server';
import { getAll } from './utils.js';
import { agent } from '../schema.js';

export interface MemoryDB {
  search(
    agentId: Id<'agents'>,
    vector: number[],
    limit?: number,
  ): Promise<{ memory: Doc<'memories'>; score: number }[]>;
  accessMemories(
    agentId: Id<'agents'>,
    queryEmbedding: number[],
    count?: number,
  ): Promise<{ memory: Doc<'memories'>; overallScore: number }[]>;
}

export const getMemories = internalQuery({
  args: { memoryIds: v.array(v.id('embeddings')) },
  handler: async (ctx, args) => {
    return await Promise.all(
      args.memoryIds.map(
        async (id) =>
          (await ctx.db
            .query('memories')
            .withIndex('embeddingId', (q) => q.eq('embeddingId', id))
            .first())!,
      ),
    );
  },
});

export const accessMemories = internalMutation({
  args: {
    candidates: v.array(v.object({ _id: v.id('embeddings'), score: v.number() })),
    count: v.number(),
  },
  handler: async (ctx, args) => {
    const relatedMemories = await Promise.all(
      args.candidates.map(
        async ({ _id }) =>
          (await ctx.db
            .query('memories')
            .withIndex('embeddingId', (q) => q.eq('embeddingId', _id))
            .first())!,
      ),
    );
    const recentMemories = await Promise.all(
      relatedMemories.map((memory) =>
        ctx.db
          .query('memoryAccesses')
          .withIndex('memoryId', (q) => q.eq('memoryId', memory._id))
          .first(),
      ),
    );
    const memoryScores = relatedMemories.map((memory, idx) => ({
      memory,
      overallScore:
        (args.candidates[idx].score + memory.importance + 0.99) ^
        // TODO: use game time, not real time
        Math.floor((Date.now() - recentMemories[idx]!._creationTime) / 1000 / 60 / 60),
    }));
    memoryScores.sort((a, b) => b.overallScore - a.overallScore);
    const accessed = memoryScores.slice(0, args.count);
    await Promise.all(
      accessed.map(({ memory }) => ctx.db.insert('memoryAccesses', { memoryId: memory._id })),
    );
    return accessed;
  },
});

export function vectorDB(ctx: ActionCtx): MemoryDB {
  // TODO: add pinecone option

  return {
    async search(agentId: Id<'agents'>, vector: number[], limit: number = 100) {
      const results = await ctx.vectorSearch('embeddings', 'embedding', {
        vector,
        vectorField: 'embedding',
        filter: (q) => q.eq('agentId', agentId),
        limit,
      });
      const memoryIds = results.map((r) => r._id);
      const memories = await ctx.runQuery(internal.lib.vector.getMemories, { memoryIds });
      return results.map(({ score }, idx) => ({ memory: memories[idx], score }));
    },
    async accessMemories(agentId: Id<'agents'>, queryEmbedding: number[], count: number = 10) {
      const results = await ctx.vectorSearch('embeddings', 'embedding', {
        vector: queryEmbedding,
        vectorField: 'embedding',
        filter: (q) => q.eq('agentId', agentId),
        limit: 10 * count,
      });
      return await ctx.runMutation(internal.lib.vector.accessMemories, {
        candidates: results,
        count,
      });
    },
  };
}
