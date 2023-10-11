import { v } from 'convex/values';
import { internal } from './_generated/api';
import { DatabaseReader, MutationCtx, internalMutation, mutation } from './_generated/server';
import { Descriptions } from '../data/characters';
import * as firstmap from '../data/firstmap';
import { insertInput } from './game/main';
import { Doc } from './_generated/dataModel';
import { createEngine, kickEngine, startEngine, stopEngine } from './engine/game';

const init = mutation({
  args: {
    numAgents: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!process.env.OPENAI_API_KEY) {
      const deploymentName = process.env.CONVEX_CLOUD_URL?.slice(8).replace('.convex.cloud', '');
      throw new Error(
        '\n  Missing OPENAI_API_KEY in environment variables.\n\n' +
          '  Get one at https://openai.com/\n\n' +
          '  Paste it on the Convex dashboard:\n' +
          '  https://dashboard.convex.dev/d/' +
          deploymentName +
          '/settings?var=OPENAI_API_KEY',
      );
    }
    const { world, engine } = await getOrCreateDefaultWorld(ctx);
    if (world.status !== 'running') {
      console.warn(
        `Engine ${engine._id} is not active! Run "npx convex run init:resume" to restart it.`,
      );
      return;
    }
    const shouldCreate = await shouldCreateAgents(ctx.db, world);
    if (shouldCreate) {
      const toCreate =
        args.numAgents !== undefined
          ? Math.min(args.numAgents, Descriptions.length)
          : Descriptions.length;
      for (let i = 0; i < toCreate; i++) {
        await insertInput(ctx, world._id, 'createAgent', {
          descriptionIndex: i,
        });
      }
    }
  },
});
export default init;

export const kick = internalMutation({
  handler: async (ctx) => {
    const { world, engine } = await getDefaultWorld(ctx.db);
    await kickEngine(ctx, internal.game.main.runStep, engine._id);
  },
});

export const stop = internalMutation({
  handler: async (ctx) => {
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

export const resume = internalMutation({
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

async function getOrCreateDefaultWorld(ctx: MutationCtx) {
  const now = Date.now();
  let world = await ctx.db
    .query('worlds')
    .filter((q) => q.eq(q.field('isDefault'), true))
    .first();
  if (!world) {
    const engineId = await createEngine(ctx, internal.game.main.runStep);
    const mapId = await ctx.db.insert('maps', {
      width: firstmap.mapWidth,
      height: firstmap.mapHeight,
      tileSetUrl: firstmap.tilesetPath,
      tileSetDim: firstmap.tileFileDim,
      tileDim: firstmap.tileDim,
      bgTiles: firstmap.bgTiles,
      objectTiles: firstmap.objmap,
    });
    const worldId = await ctx.db.insert('worlds', {
      engineId,
      isDefault: true,
      lastViewed: now,
      mapId,
      status: 'running',
    });
    world = (await ctx.db.get(worldId))!;
  }
  const engine = await ctx.db.get(world.engineId);
  if (!engine) {
    throw new Error(`Engine ${world.engineId} not found`);
  }
  return { world, engine };
}

async function shouldCreateAgents(db: DatabaseReader, world: Doc<'worlds'>) {
  const players = await db
    .query('players')
    .withIndex('active', (q) => q.eq('worldId', world._id))
    .collect();
  for (const player of players) {
    const agent = await db
      .query('agents')
      .withIndex('playerId', (q) => q.eq('playerId', player._id))
      .first();
    if (agent) {
      return false;
    }
  }
  const unactionedJoinInputs = await db
    .query('inputs')
    .withIndex('byInputNumber', (q) => q.eq('engineId', world.engineId))
    .order('asc')
    .filter((q) => q.eq(q.field('name'), 'createAgent'))
    .filter((q) => q.eq(q.field('returnValue'), undefined))
    .collect();
  if (unactionedJoinInputs.length > 0) {
    return false;
  }
  return true;
}
