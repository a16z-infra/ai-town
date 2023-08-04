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
import { getPlayer, handlePlayerAction } from './engine';
import { Action, Pose } from './types';

export const getWorld = query({
  args: {},
  handler: async (ctx, args) => {
    // TODO: based on auth, fetch the user's world
    const world = await ctx.db.query('worlds').first();
    if (!world) throw new Error('No world found');
    return {
      world,
      players: await getAllPlayers(ctx.db, world._id),
    };
  },
});

export const now = mutation({
  args: {},
  handler: async (ctx, args) => {
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
