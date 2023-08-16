import { v } from 'convex/values';
import { internal } from './_generated/api';
import { TableNames } from './_generated/dataModel';
import { internalAction, internalMutation, internalQuery } from './_generated/server';
import { getAllPlayers } from './players';
import { asyncMap, pruneNull } from './lib/utils';
import { EntryOfType, Motion, Position } from './schema';
import { clientMessageMapper } from './chat';
import { MemoryDB } from './lib/memory';
import { getPlayer, stop, walk } from './journal';
import { handleAgentInteraction } from './agent';
import schema from './schema';
import { findRoute } from './lib/routing';

export const converge = internalMutation({
  args: {},
  handler: async (ctx, args) => {
    const world = await ctx.db.query('worlds').order('desc').first();
    if (!world) throw new Error('No worlds exist yet: try running dbx convex run init');
    const players = await getAllPlayers(ctx.db, world._id);
    const target = players[0]._id;
    await stop(ctx, { playerId: target });
    for (const player of players.slice(1)) {
      if (player.agentId) {
        await walk(ctx, { agentId: player.agentId, ignore: [], target });
      }
    }
  },
});

export const stopThinking = internalMutation({
  args: {},
  handler: async (ctx, args) => {
    const world = (await ctx.db.query('worlds').order('desc').first())!;
    const agents = await ctx.db
      .query('agents')
      .withIndex('by_worldId_thinking', (q) => q.eq('worldId', world._id).eq('thinking', true))
      .collect();
    for (const agent of agents) {
      await ctx.db.patch(agent._id, { thinking: false });
    }
  },
});

export const testRouteFinding = internalQuery({
  args: {},
  handler: async (ctx, args) => {
    const map = (await ctx.db.query('maps').order('desc').first())!;
    const startMotion: Motion = {
      type: 'stopped',
      pose: { position: { x: 0, y: 1 }, orientation: 0 },
      reason: 'idle',
    };
    const otherPlayerMotion: Motion[] = [
      {
        type: 'walking',
        startTs: 0,
        targetEndTs: 2,
        route: [
          { x: 2, y: 2 },
          { x: 2, y: 1 },
        ],
        ignore: [],
      },
      { type: 'stopped', pose: { position: { x: 1, y: 3 }, orientation: 0 }, reason: 'idle' },
    ];
    const end: Position = { x: 1, y: 3 };

    return findRoute(map, startMotion, otherPlayerMotion, end, 0);
  },
});

export const debugAgentSnapshotWithThinking = internalMutation({
  args: { playerId: v.id('players') },
  handler: async (ctx, { playerId }) => {
    const playerDoc = await ctx.db.get(playerId);
    const player = await getPlayer(ctx.db, playerDoc!);
    await ctx.db.patch(player.agentId!, { thinking: true });
    return { player };
  },
});

export const agentState = internalQuery({
  args: {},
  handler: async (ctx, args) => {
    const world = await ctx.db.query('worlds').order('desc').first();
    if (!world) throw new Error('No worlds exist yet: try running dbx convex run init');
    const agents = await ctx.db
      .query('agents')
      .withIndex('by_worldId_thinking', (q) => q.eq('worldId', world._id))
      .collect();
    return agents;
  },
});

export const getDebugPlayers = internalQuery({
  handler: async (ctx) => {
    const world = await ctx.db.query('worlds').order('desc').first();
    if (!world) throw new Error('No worlds exist yet: try running dbx convex run init');
    const players = await asyncMap(await getAllPlayers(ctx.db, world._id), (p) =>
      getPlayer(ctx.db, p),
    );
    return { players, world };
  },
});

export const allPlayers = internalQuery({
  args: {},
  handler: async (ctx, args) => {
    const players = await ctx.db.query('players').collect();
    if (!players) return null;
    return asyncMap(players, (p) => getPlayer(ctx.db, p));
  },
});

export const latestPlayer = internalQuery({
  args: {},
  handler: async (ctx, args) => {
    const player = await ctx.db.query('players').order('desc').first();
    if (!player) return null;
    return getPlayer(ctx.db, player);
  },
});

export const debugPlayerIdSnapshot = internalQuery({
  args: { playerId: v.id('players') },
  handler: async (ctx, args) => {
    return getPlayer(ctx.db, (await ctx.db.get(args.playerId))!);
  },
});

export const listMessages = internalQuery({
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
          .withIndex('by_playerId_type', (q) =>
            q.eq('playerId', playerId as any).eq('data.type', 'talking'),
          )
          .order('desc')
          .take(10) as Promise<EntryOfType<'talking'>[]>,
    );
    return (
      await asyncMap(
        messageEntries.flatMap((a) => a),
        clientMessageMapper(ctx.db),
      )
    ).sort((a, b) => a.ts - b.ts);
  },
});

export const setThinking = internalMutation({
  args: { playerIds: v.array(v.id('players')) },
  handler: async (ctx, args) => {
    const players = pruneNull(await asyncMap(args.playerIds, ctx.db.get));
    for (const player of players) {
      await ctx.db.patch(player.agentId!, { thinking: true });
    }
  },
});

export const runAgentLoopClear = internalAction({
  args: {
    numberOfLoops: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.runAction(internal.init.resetFrozen);
    await runAgentLoop(ctx, args);
  },
});

export const runAgentLoop = internalAction({
  args: {
    numberOfLoops: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    console.log('Looping', args.numberOfLoops || 100);
    const { players, world } = await ctx.runQuery(internal.testing.getDebugPlayers);
    const playerIds = players.map((p) => p.id);

    let index = args.numberOfLoops || 100;
    let randomX: number[] = [];
    let displacement = 25;
    for (let i = 0; i < playerIds.length; i++) {
      randomX.push(displacement * i);
    }

    while (index-- != 0) {
      await ctx.runMutation(internal.testing.setThinking, { playerIds });
      await ctx.runAction(internal.agent.runAgentBatch, { playerIds, noSchedule: true });
    }
  },
});

// For making conversations happen without walking around, clear before conversation start.
export const runConversationClear = internalAction({
  args: { maxMessages: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await ctx.runAction(internal.init.resetFrozen);
    await runConversation(ctx, args);
  },
});
// For making conversations happen without walking around.
export const runConversation = internalAction({
  args: {
    maxMessages: v.optional(v.number()),
    conversationCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { players, world } = await ctx.runQuery(internal.testing.getDebugPlayers);
    const memory = MemoryDB(ctx);
    for (let i = 0; i < (args.conversationCount ?? 1); i++) {
      await handleAgentInteraction(ctx, players, memory, async (agentId, activity) => {
        console.log({ agentId, activity });
      });
    }
  },
});

export const debugClearAll = internalMutation({
  args: {},
  handler: async (ctx, args) => {
    for (const table in schema.tables) {
      await ctx.scheduler.runAfter(0, internal.crons.vacuumOldEntries, {
        table: table as TableNames,
        age: -1_000, // Delete 1 second into the future
        cursor: null,
        soFar: 0,
      });
    }
  },
});
