import { RAG, type EntryId } from '@convex-dev/rag';
import { components } from '../_generated/api';
import type { MutationCtx } from '../_generated/server';
import type { Doc, Id } from '../_generated/dataModel';
import { EMBEDDING_DIMENSION } from '../util/llm';

// Both ingestion and search supply vectors from AI Town's embedding provider.
// The model identifier names that existing vector space inside the component.
export const memoryIndex = new RAG(components.rag, {
  embeddingDimension: EMBEDDING_DIMENSION,
  textEmbeddingModel: 'ai-town-memory-v1',
});

export function memoryNamespace(worldId: Id<'worlds'>, playerId: string) {
  return JSON.stringify([worldId, playerId]);
}

export async function indexMemory(
  ctx: MutationCtx,
  worldId: Id<'worlds'>,
  memory: Doc<'memories'>,
  vector: number[],
) {
  const { entryId } = await memoryIndex.add(ctx, {
    namespace: memoryNamespace(worldId, memory.playerId),
    key: memory._id,
    // A mundane but exact match should still be retrievable.
    importance: 0.9 + 0.1 * (Math.max(0, Math.min(9, memory.importance)) / 9),
    chunks: [{ text: memory.description, embedding: vector }],
  });
  await ctx.db.patch(memory._id, { worldId, ragEntryId: entryId });
}

export async function removeIndexedMemory(ctx: MutationCtx, entryId: string) {
  await memoryIndex.deleteAsync(ctx, { entryId: entryId as EntryId });
}
