import { TableNames } from './_generated/dataModel';
import { internal } from './_generated/api';
import { DatabaseReader, internalMutation, mutation, query } from './_generated/server';
import { v } from 'convex/values';
import schema from './schema';
import { kickEngine, startEngine, stopEngine } from './engine/game';
import { DELETE_BATCH_SIZE } from './constants';

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
      if (engine.running) {
        throw new Error(`Engine ${engine._id} isn't stopped?`);
      }
      console.debug(`World ${world._id} is already inactive`);
      return;
    }
    console.log(`Stopping engine ${engine._id}...`);
    await ctx.db.patch(world._id, { status: 'stoppedByDeveloper' });
    await stopEngine(ctx, engine._id);
  },
});

export const resume = mutation({
  handler: async (ctx) => {
    const { world, engine } = await getDefaultWorld(ctx.db);
    if (world.status === 'running') {
      if (!engine.running) {
        throw new Error(`Engine ${engine._id} isn't running?`);
      }
      console.debug(`World ${world._id} is already running`);
      return;
    }
    console.log(`Resuming engine ${engine._id} for world ${world._id} (state: ${world.status})...`);
    await ctx.db.patch(world._id, { status: 'running' });
    await startEngine(ctx, internal.game.main.runStep, engine._id);
  },
});

export const archive = internalMutation({
  handler: async (ctx) => {
    const { world, engine } = await getDefaultWorld(ctx.db);
    if (engine.running) {
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

export const debugCreatePlayers = internalMutation({
  args: {
    numPlayers: v.number(),
  },
  handler: async (ctx, args) => {
    const world = await ctx.db
      .query('worlds')
      .filter((q) => q.eq(q.field('isDefault'), true))
      .first();
    if (!world) {
      throw new Error('No default world');
    }
    for (let i = 0; i < args.numPlayers; i++) {
      const inputId = await insertInput(ctx, world?.engineId, 'join', {
        name: `Robot${i}`,
        description: `This player is a robot.`,
        character: `f${1 + (i % 8)}`,
      });
    }
  },
});

export const randomPositions = internalMutation({
  handler: async (ctx) => {
    const world = await ctx.db
      .query('worlds')
      .filter((q) => q.eq(q.field('isDefault'), true))
      .first();
    if (!world) {
      throw new Error('No default world');
    }
    const players = await ctx.db
      .query('players')
      .withIndex('active', (q) => q.eq('engineId', world.engineId).eq('active', true))
      .collect();
    for (const player of players) {
      await insertInput(ctx, world.engineId, 'moveTo', {
        playerId: player._id,
        destination: {
          x: 1 + Math.floor(Math.random() * (mapWidth - 2)),
          y: 1 + Math.floor(Math.random() * (mapHeight - 2)),
        },
      });
    }
  },
});
