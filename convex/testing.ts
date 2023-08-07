import { v } from 'convex/values';
import { api, internal } from './_generated/api';
import { Doc, Id } from './_generated/dataModel';
import { internalAction, internalMutation, internalQuery } from './_generated/server';
import { getAgentSnapshot } from './engine';
import { getAllPlayers } from './players';
import { asyncMap } from './lib/utils';
import { Action, Entry, EntryOfType } from './types';
import { clientMessageMapper } from './chat';
import { MemoryDB } from './lib/memory';
import { converse, startConversation, walkAway } from './conversation';
import { GPTMessage } from './lib/openai';

export const debugAgentSnapshot = internalMutation({
  args: { playerId: v.id('players') },
  handler: async (ctx, { playerId }) => {
    const snapshot = await getAgentSnapshot(ctx, playerId);
    console.log('getAgentSnapshot', snapshot);
    const thinkId = await ctx.db.insert('journal', {
      playerId,
      data: {
        type: 'thinking',
        snapshot,
      },
    });
    return { snapshot, thinkId };
  },
});

export const getDebugPlayerIds = internalQuery({
  handler: async (ctx) => {
    const world = await ctx.db.query('worlds').order('desc').first();
    if (!world) throw new Error('No worlds exist yet: try running dbx convex run init');
    const players = await getAllPlayers(ctx.db, world._id);
    return { playerIds: players.map((p) => p._id), world };
  },
});

export const debugAllPlayerSnapshot = internalQuery({
  args: {},
  handler: async (ctx, args) => {
    const players = await ctx.db.query('players').collect();
    if (!players) return null;
    let snapshots = [];
    for (const player of players) {
      const snapshot = await getAgentSnapshot(ctx, player._id);
      console.log(snapshot);
      snapshots.push(snapshot);
    }
    return snapshots;
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

export const debugPlayerIdSnapshot = internalQuery({
  args: { playerId: v.id('players') },
  handler: async (ctx, args) => {
    const snapshot = await getAgentSnapshot(ctx, args.playerId);
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
          .withIndex('by_playerId_type', (q) =>
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

// For making conversations happen without walking around.
export const runConversationClear = internalAction({
  args: { numPlayers: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    await ctx.runAction(internal.init.resetFrozen);
    await runConversation(ctx, args);
  },
});
// For making conversations happen without walking around.
export const runConversation = internalAction({
  args: { numPlayers: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const { playerIds, world } = await ctx.runQuery(internal.testing.getDebugPlayerIds);
    const memory = MemoryDB(ctx);
    let ourConversationId: Id<'conversations'> | null = null;
    let walkawayCount = 0;
    while (walkawayCount != 2) {
      for (const playerId of playerIds) {
        console.log('playerId', playerId);
        const { snapshot, thinkId } = await ctx.runMutation(internal.testing.debugAgentSnapshot, {
          playerId,
        });
        const actionAPI = (action: Action) =>
          ctx.runMutation(internal.engine.handleAgentAction, {
            playerId,
            action,
            noSchedule: true,
          });
        const { player, nearbyPlayers, nearbyConversations } = snapshot;
        const currentConversation = nearbyConversations.find(
          (a) => a.conversationId == player.lastSpokeConversationId,
        );
        if (nearbyPlayers.find(({ player }) => player.thinking)) {
          throw new Error('Unexpected thinking player ' + playerId);
        }
        console.log('snapshot', snapshot);
        if (!currentConversation && ourConversationId == null) {
          // If we're not in a conversation, start one.
          if (nearbyConversations.length) {
            throw new Error('Unexpected conversations taking place');
          }
          const audience = nearbyPlayers.map(({ player }) => player);
          const conversationEntry = (await actionAPI({
            type: 'startConversation',
            audience: audience.map((a) => a.id),
          })) as EntryOfType<'startConversation'>;
          console.log('conversationEntry', conversationEntry);
          if (!conversationEntry) throw new Error('Unexpected failure to start conversation');
          const audienceNames = audience.map((a) => a.name);
          const playerCompletion = await startConversation(audienceNames, memory, player);
          if (
            !(await actionAPI({
              type: 'talking',
              audience: audience.map((a) => a.id),
              content: playerCompletion,
              conversationId: conversationEntry.data.conversationId,
            }))
          ) {
            throw new Error('Unexpected failure to start conversation');
          }

          ourConversationId = conversationEntry.data.conversationId;
        } else {
          // If we're in a conversation, keep talking.
          if (
            nearbyConversations.length !== 1 &&
            nearbyConversations.find((a) => a.conversationId !== ourConversationId)
          ) {
            throw new Error('Unexpected conversations taking place');
          }
          const { conversationId, messages } = nearbyConversations[0];

          const chatHistory: GPTMessage[] = [
            ...messages.map((m) => ({
              role: 'user' as const,
              content: `${m.fromName} to ${m.toNames.join(',')}: ${m.content}\n`,
            })),
          ];
          const shouldWalkAway = await walkAway(chatHistory, player);

          if (shouldWalkAway) {
            walkawayCount++;
            await actionAPI({ type: 'leaveConversation', conversationId });
            console.log('Is walking away playername', player.name);
            const done = await actionAPI({ type: 'done', thinkId });
            console.log('actionApi.done', done);
            continue;
          }
          const playerCompletion = await converse(chatHistory, player, nearbyPlayers, memory);
          // display the chat via actionAPI
          await actionAPI({
            type: 'talking',
            audience: nearbyPlayers.map(({ player }) => player.id),
            content: playerCompletion,
            conversationId: conversationId,
          });
        }
        const done = await actionAPI({ type: 'done', thinkId });
        console.log('outside bracket done', done);
        console.log('playername', player.name);
      }
    }
    if (!ourConversationId) throw new Error('No conversationId');
    for (const playerId of playerIds) {
      const snapshot = await ctx.runQuery(internal.testing.debugPlayerIdSnapshot, {
        playerId,
      });
      const player = snapshot.player;
      await memory.rememberConversation(
        player.name,
        playerId,
        player.identity,
        ourConversationId,
        Date.now(),
      );
    }
  },
});
