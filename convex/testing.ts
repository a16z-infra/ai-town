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
import { getAgentSnapshot } from './engine';

export const debugPlanAgent = internalMutation({
  args: { playerId: v.id('players') },
  handler: async (ctx, { playerId }) => {
    const snapshot = await getAgentSnapshot(ctx, playerId);
    await ctx.db.insert('journal', {
      ts: Date.now(),
      playerId,
      data: {
        type: 'thinking',
        snapshot,
      },
    });
    return snapshot;
  },
});

export const getDebugPlayerIds = internalQuery({
  handler: async (ctx) => {
    const world = await ctx.db.query('worlds').order('desc').first();
    if (!world) throw new Error('No worlds exist yet: try running dbx convex run init');
    const players = await ctx.db
      .query('players')
      .withIndex('by_worldId', (q) => q.eq('worldId', world._id))
      .collect();
    return players.map((p) => p._id);
  },
});
