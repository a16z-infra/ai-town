import { v } from 'convex/values';
import { api, internal } from './_generated/api';
import { Doc, Id } from './_generated/dataModel';
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server';
import { handlePlayerAction } from './engine';
import { Action, Pose } from './types';

export const createPlayer = mutation({
  args: { pose: Pose, name: v.string(), worldId: v.id('worlds') },
  handler: async (ctx, args) => {
    // TODO: associate this with an authed user
    const playerId = await ctx.db.insert('players', {
      name: args.name,
      worldId: args.worldId,
    });
    await ctx.db.insert('journal', {
      playerId,
      ts: Date.now(),
      data: { type: 'stopped', reason: 'idle', pose: args.pose },
    });
    await ctx.scheduler.runAfter(0, internal.engine.tick, { worldId: args.worldId });
    return playerId;
  },
});

// TODO: use auth instead of passing up playerId
export const handleUserAction = mutation({
  args: { playerId: v.id('players'), action: Action },
  handler: async (ctx, args) => {
    return await handlePlayerAction(ctx, args);
  },
});
