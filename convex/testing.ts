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

async function deleteBatch<TableName extends TableNames>(
  db: DatabaseWriter,
  table: TableName,
  cursor: null | string,
) {
  const results = await db.query(table).paginate({ cursor, numItems: DELETE_BATCH_SIZE });
  for (const row of results.page) {
    await db.delete(row._id);
  }
  return { isDone: results.isDone, cursor: results.continueCursor };
}
