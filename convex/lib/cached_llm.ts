import { v } from 'convex/values';
import { internal } from '../_generated/api';
import { ActionCtx, internalMutation, internalQuery } from '../_generated/server';
import * as openai from './openai';
import { asyncMap, pruneNull } from './utils';

export async function fetchEmbeddingBatch(ctx: ActionCtx, texts: string[], write = false) {
  const start = Date.now();
  const cachedEmbeddings = await ctx.runQuery(internal.lib.cached_llm.getEmbeddingsByText, {
    texts,
  });
  const cacheMisses = texts.filter((_, idx) => !cachedEmbeddings[idx]);
  const { embeddings: missingEmbeddings } = cacheMisses.length
    ? await openai.fetchEmbeddingBatch(cacheMisses)
    : { embeddings: [] };
  missingEmbeddings.reverse();
  // Swap the cache misses with calculated embeddings
  const embeddings = cachedEmbeddings.map((cached) => cached || missingEmbeddings.pop()!);
  if (write) {
    await ctx.runMutation(internal.lib.cached_llm.writeEmbeddings, {
      embeddings: texts.map((text, idx) => ({ text, embedding: embeddings[idx] })),
    });
    throw new Error('Writeback not yet implemented for fetchEmbeddingBatch');
  }
  return {
    embeddings,
    hits: pruneNull(cachedEmbeddings).length,
    ms: Date.now() - start,
  };
}

export async function fetchEmbedding(ctx: ActionCtx, text: string, write = false) {
  const { embeddings, ...stats } = await fetchEmbeddingBatch(ctx, [text], write);
  return { embedding: embeddings[0], ...stats };
}

// Used to populate the cache.
export const writeEmbeddings = internalMutation({
  args: { embeddings: v.array(v.object({ text: v.string(), embedding: v.array(v.number()) })) },
  handler: async (ctx, args) => {
    return asyncMap(args.embeddings, async ({ text, embedding }) =>
      ctx.db.insert('embeddings', { text, embedding }),
    );
  },
});

export const getEmbeddingsByText = internalQuery({
  args: { texts: v.array(v.string()) },
  handler: async (ctx, args) => {
    return asyncMap(args.texts, async (text) => {
      const existing = await ctx.db
        .query('embeddings')
        .withIndex('by_text', (q) => q.eq('text', text))
        .first();
      if (existing) return existing.embedding;
      return null;
    });
  },
});
