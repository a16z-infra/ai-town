import { v } from 'convex/values';
import { api, internal } from './_generated/api';
import { Doc, Id } from './_generated/dataModel';
import {
  DatabaseReader,
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server';
import { HEARTBEAT_PERIOD, getPlayer, handlePlayerAction } from './engine';
import { Action, Pose } from './schema';

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
  handler: async (ctx, args) => {
    // TODO: associate this with an authed user
    const playerId = await ctx.db.insert('players', {
      name: args.name,
      characterId: args.characterId,
      worldId: args.worldId,
    });
    await ctx.db.insert('journal', {
      playerId,
      data: { type: 'stopped', reason: 'idle', pose: args.pose },
    });
    await ctx.scheduler.runAfter(0, internal.engine.tick, {
      worldId: args.worldId,
    });
    return playerId;
  },
});

export const handleUserAction = mutation({
  // TODO: use auth instead of passing up playerId
  args: { playerId: v.id('players'), action: Action },
  handler: async (ctx, args) => {
    return await handlePlayerAction(ctx, args);
  },
});

export async function getAllPlayers(db: DatabaseReader, worldId: Id<'worlds'>) {
  return await db
    .query('players')
    .withIndex('by_worldId', (q) => q.eq('worldId', worldId))
    .collect();
}
