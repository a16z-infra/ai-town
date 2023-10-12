import { TableNames } from './_generated/dataModel';
import { internal } from './_generated/api';
import { DatabaseReader, internalMutation, mutation, query } from './_generated/server';
import { v } from 'convex/values';
import schema from './schema';
import { kickAgents, stopAgents } from './agent/init';
import { kickEngine, startEngine, stopEngine } from './engine/game';

const DELETE_BATCH_SIZE = 64;

// Clear all of the tables except for the embeddings cache.
const excludedTables: Array<TableNames> = ['embeddingsCache'];

export const wipeAllTables = internalMutation({
  handler: async (ctx) => {
    for (const tableName of Object.keys(schema.tables)) {
      if (excludedTables.includes(tableName as TableNames)) {
        continue;
      }
      await ctx.scheduler.runAfter(0, internal.testing.deletePage, { tableName, cursor: null });
    }
  },
});

export const deletePage = internalMutation({
  args: {
    tableName: v.string(),
    cursor: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query(args.tableName as TableNames)
      .paginate({ cursor: args.cursor, numItems: DELETE_BATCH_SIZE });
    for (const row of results.page) {
      await ctx.db.delete(row._id);
    }
    if (!results.isDone) {
      await ctx.scheduler.runAfter(0, internal.testing.deletePage, {
        tableName: args.tableName,
        cursor: results.continueCursor,
      });
    }
  },
});

export const kick = internalMutation({
  handler: async (ctx) => {
    const { world, engine } = await getDefaultWorld(ctx.db);
    await kickEngine(ctx, internal.game.main.runStep, engine._id);
    await kickAgents(ctx, { worldId: world._id });
  },
});

export const stopAllowed = query({
  handler: async () => {
    return !process.env.STOP_NOT_ALLOWED;
  },
});

export const stop = mutation({
  handler: async (ctx) => {
    if (process.env.STOP_NOT_ALLOWED) throw new Error('Stop not allowed');
    const { world, engine } = await getDefaultWorld(ctx.db);
    if (world.status === 'inactive' || world.status === 'stoppedByDeveloper') {
      if (engine.state.kind !== 'stopped') {
        throw new Error(`Engine ${engine._id} isn't stopped?`);
      }
      console.debug(`World ${world._id} is already inactive`);
      return;
    }
    console.log(`Stopping engine ${engine._id}...`);
    await ctx.db.patch(world._id, { status: 'stoppedByDeveloper' });
    await stopEngine(ctx, engine._id);
    await stopAgents(ctx, { worldId: world._id });
  },
});

export const resume = mutation({
  handler: async (ctx) => {
    const { world, engine } = await getDefaultWorld(ctx.db);
    if (world.status === 'running') {
      if (engine.state.kind !== 'running') {
        throw new Error(`Engine ${engine._id} isn't running?`);
      }
      console.debug(`World ${world._id} is already running`);
      return;
    }
    console.log(`Resuming engine ${engine._id} for world ${world._id} (state: ${world.status})...`);
    await ctx.db.patch(world._id, { status: 'running' });
    await startEngine(ctx, internal.game.main.runStep, engine._id);
    await kickAgents(ctx, { worldId: world._id });
  },
});

export const archive = internalMutation({
  handler: async (ctx) => {
    const { world, engine } = await getDefaultWorld(ctx.db);
    if (engine.state.kind === 'running') {
      throw new Error(`Engine ${engine._id} is still running!`);
    }
    console.log(`Archiving world ${world._id}...`);
    await ctx.db.patch(world._id, { isDefault: false });
  },
});

async function getDefaultWorld(db: DatabaseReader) {
  const world = await db
    .query('worlds')
    .filter((q) => q.eq(q.field('isDefault'), true))
    .first();
  if (!world) {
    throw new Error('No default world found');
  }
  const engine = await db.get(world.engineId);
  if (!engine) {
    throw new Error(`Engine ${world.engineId} not found`);
  }
  return { world, engine };
}
