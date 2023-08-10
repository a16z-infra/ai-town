import { v } from 'convex/values';
import { internal } from '../_generated/api';
import { ActionCtx, internalMutation, internalQuery } from '../_generated/server';
import * as openai from './openai';
import { asyncMap, pruneNull } from './utils';

export async function fetchEmbeddingBatchWithCache(
  ctx: ActionCtx,
  texts: string[],
  opts: { write: boolean } = { write: false },
) {
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
  if (opts.write && cacheMisses.length) {
    await ctx.runMutation(internal.lib.cached_llm.writeEmbeddings, {
      embeddings: texts
        .map((text, idx) => ({ text, embedding: embeddings[idx] }))
        .filter((_, idx) => cachedEmbeddings[idx] === null),
    });
  }
  return {
    embeddings,
    hits: pruneNull(cachedEmbeddings).length,
    ms: Date.now() - start,
  };
}

export async function fetchEmbeddingWithCache(
  ctx: ActionCtx,
  text: string,
  opts: { write: boolean } = { write: false },
) {
  const { embeddings, ...stats } = await fetchEmbeddingBatchWithCache(ctx, [text], opts);
  return { embedding: embeddings[0], ...stats };
}

// Used to populate the cache.
export const writeEmbeddings = internalMutation({
  args: { embeddings: v.array(v.object({ text: v.string(), embedding: v.array(v.number()) })) },
  handler: async (ctx, args) => {
    return asyncMap(args.embeddings, ({ text, embedding }) =>
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
