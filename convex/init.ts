import { v } from 'convex/values';
import { api, internal } from './_generated/api';
import {
  DatabaseReader,
  DatabaseWriter,
  MutationCtx,
  internalMutation,
  mutation,
} from './_generated/server';
import { Descriptions } from '../data/characters';
import * as firstmap from '../data/firstmap';
import { insertInput } from './game/main';
import { initAgent, kickAgents, resumeAgents, stopAgents } from './agent/init';
import { Doc, Id } from './_generated/dataModel';
import { createEngine, kickEngine, startEngine, stopEngine } from './engine/game';

const init = mutation({
  handler: async (ctx) => {
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
    // Send inputs to create players for all of the agents.
    if (await shouldCreateAgents(ctx.db, world)) {
      let i = 0;
      for (const agent of Descriptions) {
        if (i > 3) {
          break;
        }
        i += 1;
        const inputId = await insertInput(ctx, world._id, 'join', {
          name: agent.name,
          description: agent.identity,
          character: agent.character,
        });
        await ctx.scheduler.runAfter(1000, internal.init.completeAgentCreation, {
          worldId: world._id,
          joinInputId: inputId,
          character: agent.character,
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
    await kickAgents(ctx, { worldId: world._id });
  },
});

export const stop = internalMutation({
  handler: async (ctx) => {
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

export const resume = internalMutation({
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
    await resumeAgents(ctx, { worldId: world._id });
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
    .filter((q) => q.eq(q.field('name'), 'join'))
    .filter((q) => q.eq(q.field('returnValue'), undefined))
    .collect();
  if (unactionedJoinInputs.length > 0) {
    return false;
  }
  return true;
}

export const completeAgentCreation = internalMutation({
  args: {
    worldId: v.id('worlds'),
    joinInputId: v.id('inputs'),
    character: v.string(),
  },
  handler: async (ctx, args) => {
    const input = await ctx.db.get(args.joinInputId);
    if (!input || input.name !== 'join') {
      throw new Error(`Invalid input ID ${args.joinInputId}`);
    }
    const { returnValue } = input;
    if (!returnValue) {
      console.warn(`Input ${input._id} not ready, waiting...`);
      ctx.scheduler.runAfter(5000, internal.init.completeAgentCreation, args);
      return;
    }
    if (returnValue.kind === 'error') {
      throw new Error(`Error creating agent: ${returnValue.message}`);
    }
    const playerId = returnValue.value;
    const existingAgent = await ctx.db
      .query('agents')
      .withIndex('playerId', (q) => q.eq('playerId', playerId))
      .first();
    if (existingAgent) {
      throw new Error(`Agent for player ${playerId} already exists`);
    }
    await initAgent(ctx, { worldId: args.worldId, playerId, character: args.character });
  },
});
