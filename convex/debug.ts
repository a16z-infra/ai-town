import { internal } from './_generated/api';
import { TableNames } from './_generated/dataModel';
import { DatabaseWriter, internalMutation } from './_generated/server';

export const clear = internalMutation({
  handler: async (ctx) => {
    const tables: Array<TableNames> = [
      'conversationMembers',
      'conversations',
      'inputs',
      'players',
      'engines',
      'locations',
      'worlds',
      'agents',
      'conversationMemories',
      'messages',
      'typingIndicator',
    ];
    const maxRows = 128;
    let deleted = 0;
    try {
      for (const table of tables) {
        deleted += await deleteBatch(ctx.db, table, maxRows - deleted);
      }
    } catch (e: unknown) {
      if (e instanceof HasMoreError) {
        ctx.scheduler.runAfter(0, internal.debug.clear, {});
        return 'hasMore';
      }
      throw e;
    }
    return 'ok!';
  },
});

class HasMoreError extends Error {}

async function deleteBatch<TableName extends TableNames>(
  db: DatabaseWriter,
  table: TableName,
  max: number,
): Promise<number> {
  let deleted = 0;
  while (true) {
    if (deleted >= max) {
      throw new HasMoreError();
    }
    const batch = await db.query(table).take(max - deleted);
    for (const row of batch) {
      await db.delete(row._id);
      deleted += 1;
    }
    if (!batch.length) {
      break;
    }
  }
  return deleted;
}
