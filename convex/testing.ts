import { TableNames } from './_generated/dataModel';
import { internal } from './_generated/api';
import { DatabaseWriter, internalMutation } from './_generated/server';
import { v } from 'convex/values';

const DELETE_BATCH_SIZE = 64;

// Clear all of the tables except for the embeddings cache.
const tables: Array<TableNames> = [
  'conversationMembers',
  'conversations',
  'inputs',
  'players',
  'engines',
  'locations',
  'worlds',
  'agents',
  'memories',
  'memoryEmbeddings',
  'messages',
  'typingIndicator',
];

export const wipeAllTables = internalMutation({
  handler: async (ctx) => {
    await deletePage(ctx, { tableIndex: 0, cursor: null });
  },
});

export const deletePage = internalMutation({
  args: {
    tableIndex: v.number(),
    cursor: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    if (args.tableIndex >= tables.length) {
      return;
    }
    const table = tables[args.tableIndex];
    const { isDone, cursor } = await deleteBatch(ctx.db, table, args.cursor);

    const newArgs = isDone
      ? { tableIndex: args.tableIndex + 1, cursor: null }
      : { tableIndex: args.tableIndex, cursor };
    await ctx.scheduler.runAfter(0, internal.testing.deletePage, newArgs);
  },
});

export const runAgentLoop = internalAction({
  args: {
    numberOfLoops: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    console.log('Looping', args.numberOfLoops || 100);
    const { players, world } = await ctx.runQuery(internal.testing.getDebugPlayers);
    const playerIds = players.map((p) => p.id);

    let index = args.numberOfLoops || 100;
    const randomX: number[] = [];
    const displacement = 25;
    for (let i = 0; i < playerIds.length; i++) {
      randomX.push(displacement * i);
    }

    while (index-- != 0) {
      await ctx.runMutation(internal.testing.setThinking, { playerIds });
      await ctx.runAction(internal.agent.runAgentBatch, { playerIds, noSchedule: true });
    }
  },
});

export const replicate = internalAction({
  args: {},
  handler: async (cts, args) => {
    const result = await enqueueBackgroundMusicGeneration(cts, args);
    console.log(result)
  }
  return { isDone: results.isDone, cursor: results.continueCursor };
}
