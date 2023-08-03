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
import { getAllPlayers } from './players';
import { asyncMap } from './lib/utils';
import { EntryOfType } from './types';
import { clientMessageMapper } from './chat';

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
    const players = await getAllPlayers(ctx.db, world._id);
    return players.map((p) => p._id);
  },
});

export const debugPlayerSnapshot = internalQuery({
  args: {},
  handler: async (ctx, args) => {
    const player = await ctx.db.query('players').first();
    if (!player) return null;
    const snapshot = await getAgentSnapshot(ctx, player._id);
    return snapshot;
  },
});

export const debugListMessages = internalQuery({
  args: {},
  handler: async (ctx, args) => {
    const world = await ctx.db.query('worlds').order('desc').first();
    if (!world) return [];
    const players = await getAllPlayers(ctx.db, world._id);
    const playerIds = players.map((p) => p._id);
    const messageEntries = await asyncMap(
      playerIds,
      (playerId) =>
        ctx.db
          .query('journal')
          .withIndex('by_playerId_type_ts', (q) =>
            q.eq('playerId', playerId as any).eq('data.type', 'talking'),
          )
          .collect() as Promise<EntryOfType<'talking'>[]>,
    );
    return (
      await asyncMap(
        messageEntries.flatMap((a) => a),
        clientMessageMapper(ctx.db),
      )
    ).sort((a, b) => a.ts - b.ts);
  },
});
