import { v } from 'convex/values';
import { internal } from './_generated/api';
import { DatabaseReader, MutationCtx, internalMutation, mutation } from './_generated/server';
import { Descriptions } from '../data/characters';
import * as firstmap from '../data/firstmap';
import { insertInput } from './game/main';
import { initAgent } from './agent/init';
import { Doc } from './_generated/dataModel';
import { createEngine } from './engine/game';

const DEFAULT_NUM_AGENTS = 4;

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
        `Engine ${engine._id} is not active! Run "npx convex run testing:resume" to restart it.`,
      );
      return;
    }
    // Send inputs to create players for all of the agents.
    if (await shouldCreateAgents(ctx.db, world)) {
      const numAgents = Math.min(args.numAgents ?? DEFAULT_NUM_AGENTS, Descriptions.length);
      let numCreated = 0;
      for (const agent of Descriptions) {
        if (numCreated >= numAgents) {
          break;
        }
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
        numCreated++;
      }
    }
  },
});
export default init;

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
