import { v } from 'convex/values';
import { Id } from './_generated/dataModel';
import { DatabaseReader, mutation, query } from './_generated/server';
import { enqueueAgentWake } from './engine';
import { HEARTBEAT_PERIOD, WORLD_IDLE_THRESHOLD } from './config';
import { Pose } from './schema';
import { getPlayer } from './journal';
import { internal } from './_generated/api';

export const getWorld = query({
  args: {},
  handler: async (ctx, args) => {
    // Future: based on auth, fetch the user's world
    const world = await ctx.db.query('worlds').order('desc').first();
    if (!world) {
      console.error('No world found');
      return null;
    }
    const map = await ctx.db.get(world.mapId);
    if (!map) throw new Error('No map found for world ' + world._id);
    return {
      world,
      map,
      players: await getAllPlayers(ctx.db, world._id),
    };
  },
});

export const now = mutation({
  args: { worldId: v.id('worlds') },
  handler: async (ctx, { worldId }) => {
    // Future: based on auth, heartbeat for that user for presence
    // TODO: make heartbeats world-specific
    const lastHeartbeat = await ctx.db.query('heartbeats').order('desc').first();
    if (!lastHeartbeat || lastHeartbeat._creationTime + HEARTBEAT_PERIOD < Date.now()) {
      // Keep the world ticking.
      await ctx.db.insert('heartbeats', {});
      if (!lastHeartbeat || lastHeartbeat._creationTime + WORLD_IDLE_THRESHOLD < Date.now()) {
        // Start up the world if it's been idle for a while.
        await ctx.scheduler.runAfter(0, internal.engine.tick, { worldId });
      }
    }
    return Date.now();
  },
});

export const characterData = query({
  args: { characterId: v.id('characters') },
  handler: async (ctx, { characterId }) => {
    const character = await ctx.db.get(characterId);
    if (!character) throw new Error('No character found for ' + characterId);
    return character;
  },
});

export const playerState = query({
  args: { playerId: v.id('players') },
  handler: async (ctx, args) => {
    const playerDoc = (await ctx.db.get(args.playerId))!;
    const player = await getPlayer(ctx.db, playerDoc);
    return player;
  },
});

export const createPlayer = mutation({
  args: {
    pose: Pose,
    name: v.string(),
    worldId: v.id('worlds'),
    characterId: v.id('characters'),
  },
  handler: async (ctx, { name, worldId, characterId, ...args }) => {
    // Future: associate this with an authed user
    const playerId = await ctx.db.insert('players', {
      name,
      characterId,
      worldId,
    });
    await ctx.db.insert('journal', {
      playerId,
      data: { type: 'stopped', reason: 'idle', pose: args.pose },
    });
    return playerId;
  },
});

// Future: this could allow creating an agent
export const createAgent = mutation({
  args: {
    pose: Pose,
    name: v.string(),
    worldId: v.id('worlds'),
    characterId: v.id('characters'),
  },
  handler: async (ctx, { name, worldId, characterId, ...args }) => {
    // Future: associate this with an authed user
    const playerId = await ctx.db.insert('players', {
      name,
      characterId,
      worldId,
    });
    const agentId = await ctx.db.insert('agents', {
      playerId,
      scheduled: true,
      thinking: false,
      worldId,
      nextWakeTs: Date.now(),
      lastWakeTs: Date.now(),
    });
    await ctx.db.patch(playerId, { agentId });
    await ctx.db.insert('journal', {
      playerId,
      data: { type: 'stopped', reason: 'idle', pose: args.pose },
    });
    await enqueueAgentWake(ctx, agentId, worldId, Date.now());
    return playerId;
  },
});

export async function getAllPlayers(db: DatabaseReader, worldId: Id<'worlds'>) {
  return await db
    .query('players')
    .withIndex('by_worldId', (q) => q.eq('worldId', worldId))
    .collect();
}
