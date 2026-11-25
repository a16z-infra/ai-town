import { internal } from '../_generated/api';
import { v } from 'convex/values';
import { internalMutation, type DatabaseReader } from '../_generated/server';
import type { Doc, Id } from '../_generated/dataModel';
import { indexMemory, memoryNamespace } from './memoryIndex';

// A game ID can recur in another world. Never infer ownership from playerId alone.
async function resolveWorld(
  db: DatabaseReader,
  memory: Doc<'memories'>,
): Promise<Id<'worlds'> | undefined> {
  if (memory.worldId) return memory.worldId;
  if (memory.data.type === 'conversation') {
    const { conversationId, playerIds } = memory.data;
    const archives = await db
      .query('archivedConversations')
      .withIndex('conversationId', (q) => q.eq('id', conversationId))
      .take(2);
    const archive = archives[0];
    if (
      archives.length === 1 &&
      archive.ended <= memory._creationTime &&
      [memory.playerId, ...playerIds].every((id) => archive.participants.includes(id))
    )
      return archive.worldId;
  }
  if (memory.data.type === 'reflection') {
    let owner;
    for (const id of memory.data.relatedMemoryIds) {
      const source = await db.get(id);
      if (
        !source?.worldId ||
        source.playerId !== memory.playerId ||
        (owner && owner !== source.worldId)
      )
        return;
      owner = source.worldId;
    }
    return owner;
  }
}

// Advance with the returned cursor. Chronological order visits source memories
// before reflections. A fresh pass safely retries previously unresolved rows.
export const backfill = internalMutation({
  args: {
    cursor: v.union(v.string(), v.null()),
    runToEnd: v.optional(v.boolean()),
    totals: v.optional(
      v.object({ indexed: v.number(), unresolved: v.number(), missingVector: v.number() }),
    ),
  },
  handler: async (ctx, { cursor, runToEnd, totals }) => {
    const page = await ctx.db.query('memories').paginate({ cursor, numItems: 8 });
    let { indexed, unresolved, missingVector } = totals ?? {
      indexed: 0,
      unresolved: 0,
      missingVector: 0,
    };
    for (const memory of page.page) {
      if (memory.ragEntryId) continue;
      const worldId = await resolveWorld(ctx.db, memory);
      if (!worldId) {
        unresolved++;
        continue;
      }
      const vector = await ctx.db.get(memory.embeddingId);
      if (!vector || vector.playerId !== memory.playerId) {
        missingVector++;
        continue;
      }
      await indexMemory(ctx, worldId, memory, vector.embedding);
      await ctx.db.patch(vector._id, { namespace: memoryNamespace(worldId, memory.playerId) });
      indexed++;
    }
    const counts = { indexed, unresolved, missingVector };
    if (runToEnd) {
      if (page.isDone) console.log('Memory backfill complete', counts);
      else
        await ctx.scheduler.runAfter(0, internal.agent.migrateMemories.backfill, {
          cursor: page.continueCursor,
          runToEnd,
          totals: counts,
        });
    }
    return { ...counts, cursor: page.continueCursor, done: page.isDone };
  },
});
