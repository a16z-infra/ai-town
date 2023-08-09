import { v } from 'convex/values';
import { Id } from './_generated/dataModel';
import { DatabaseReader, mutation, query } from './_generated/server';
import { enqueueAgentWake } from './engine';
import { HEARTBEAT_PERIOD } from './config';
import { Pose } from './schema';
import { getPlayer } from './journal';

export const getWorld = query({
  args: {},
  handler: async (ctx, args) => {
    // TODO: based on auth, fetch the user's world
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
  args: {},
  handler: async (ctx, args) => {
    // TODO: based on auth, heartbeat for that user for presence
    const lastHeartbeat = await ctx.db.query('heartbeats').order('desc').first();
    if (!lastHeartbeat || lastHeartbeat._creationTime + HEARTBEAT_PERIOD < Date.now()) {
      await ctx.db.insert('heartbeats', {});
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
    // TODO: associate this with an authed user
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
    // TODO: associate this with an authed user
    const playerId = await ctx.db.insert('players', {
      name,
      characterId,
      worldId,
    });
    const agentId = await ctx.db.insert('agents', {
      playerId,
      scheduled: false,
      thinking: false,
      worldId,
      nextWakeTs: Date.now(),
      lastWakeTs: Date.now(),
      alsoWake: [],
    });
    await ctx.db.patch(playerId, { agentId });
    await ctx.db.insert('journal', {
      playerId,
      data: { type: 'stopped', reason: 'idle', pose: args.pose },
    });
    await enqueueAgentWake(ctx.db, agentId, []);
    return playerId;
  },
});

export async function getAllPlayers(db: DatabaseReader, worldId: Id<'worlds'>) {
  return await db
    .query('players')
    .withIndex('by_worldId', (q) => q.eq('worldId', worldId))
    .collect();
}
