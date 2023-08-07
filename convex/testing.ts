import { v } from 'convex/values';
import { api, internal } from './_generated/api';
import { Doc, Id } from './_generated/dataModel';
import { internalAction, internalMutation, internalQuery } from './_generated/server';
import { getAgentSnapshot, handlePlayerAction } from './engine';
import { getAllPlayers } from './players';
import { asyncMap } from './lib/utils';
import { Action, Entry, EntryOfType, Motion, Player, Pose } from './types';
import { clientMessageMapper } from './chat';
import { MemoryDB } from './lib/memory';
import { chatHistoryFromMessages, converse, startConversation, walkAway } from './conversation';

export const converge = internalMutation({
  args: {},
  handler: async (ctx, args) => {
    const worlds = await ctx.db.query('worlds').collect();
    for (const world of worlds) {
      const players = await getAllPlayers(ctx.db, world._id);
      const position = {
        x: Math.floor(Math.random() * world.width),
        y: Math.floor(Math.random() * world.height),
      };
      for (const player of players) {
        await handlePlayerAction(ctx, {
          playerId: player._id,
          action: {
            type: 'travel',
            position,
          },
        });
      }
    }
  },
});

export const debugAgentSnapshotWithThinking = internalMutation({
  args: { playerId: v.id('players') },
  handler: async (ctx, { playerId }) => {
    const snapshot = await getAgentSnapshot(ctx, playerId);
    // console.log('getAgentSnapshot', snapshot);
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
    const { playerIds, world } = await ctx.runQuery(internal.testing.getDebugPlayerIds);

    let index = args.numberOfLoops || 100;
    let randomX: number[] = [];
    let displacement = 25;
    for (let i = 0; i < playerIds.length; i++) {
      randomX.push(displacement * i);
    }

    while (index-- != 0) {
      for (const [playerIndex, playerId] of playerIds.entries()) {
        // console.log('playerId', playerId);

        // hacky way of geting agents at different location trigger as "new"
        let x = index % 2 == 0 ? 0 : randomX[playerIndex];
        // move them nearby each other
        ctx.runMutation(internal.testing.movePlayer, { playerId, x: x, y: 0 });

        const actionAPI = (action: Action) =>
          ctx.runMutation(internal.engine.handleAgentAction, {
            playerId,
            action,
            noSchedule: true,
          });

        const { snapshot, thinkId } = await ctx.runMutation(
          internal.testing.debugAgentSnapshotWithThinking,
          {
            playerId,
          },
        );

        // console.log("snapshot.nearbyPlayers", snapshot.nearbyPlayers)

        // console.log('Run Agent Loop. Think ID', thinkId);
        // run the loop
        await ctx.runAction(internal.agent.runAgent, {
          snapshot,
          world,
          thinkId,
          noSchedule: true,
        });

        const afterSnapshot = await ctx.runQuery(internal.testing.debugPlayerIdSnapshot, {
          playerId,
        });
        const { player } = afterSnapshot;

        // console.log('AfterSnapshot.player.motion', player.motion);
        // Agent Loop might make them move. stop them so they're likely to talk on next loop
        if (player.motion.type === 'walking') {
          // console.log("Stopping player")
          await actionAPI({
            type: 'stop',
          });
        }
      }
    }
  },
});

export const movePlayer = internalMutation({
  args: { playerId: v.id('players'), x: v.number(), y: v.number() },
  handler: async (ctx, args) => {
    const motion = {
      type: 'stopped',
      reason: 'idle',
      pose: { position: { x: args.x, y: args.y }, orientation: 0 } as Pose,
    } as Motion;
    await ctx.db.insert('journal', {
      playerId: args.playerId,
      data: motion,
    });
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
    const { playerIds, world } = await ctx.runQuery(internal.testing.getDebugPlayerIds);
    const memory = MemoryDB(ctx);
    let ourConversationId: Id<'conversations'> | null = null;
    let maxConversationsCount = args.conversationCount || 1;
    let conversationsCompleted = 0;
    let walkawayCount = 0;
    // 1 Conversation is completed when 2 agents leaves the conversations?
    while (maxConversationsCount * 2 > conversationsCompleted) {
      for (const playerId of playerIds) {
        console.log('playerId', playerId);
        const { snapshot, thinkId } = await ctx.runMutation(
          internal.testing.debugAgentSnapshotWithThinking,
          {
            playerId,
          },
        );
        const actionAPI = (action: Action) =>
          ctx.runMutation(internal.engine.handleAgentAction, {
            playerId,
            action,
            noSchedule: true,
          });
        const { player, nearbyPlayers, nearbyConversations } = snapshot;
        const currentConversation = nearbyConversations.find(
          (a) => a.conversationId == player.lastChat?.conversationId,
        );
        if (nearbyPlayers.find(({ player }) => player.thinking)) {
          throw new Error('Unexpected thinking player ' + playerId);
        }
        console.log('snapshot', snapshot);
        const players = nearbyPlayers.map(({ player }) => player);
        const audience = players.map((a) => a.id);
        if (!currentConversation && ourConversationId == null) {
          // If we're not in a conversation, start one.
          if (nearbyConversations.length) {
            throw new Error('Unexpected conversations taking place');
          }
          const conversationEntry = (await actionAPI({
            type: 'startConversation',
            audience,
          })) as EntryOfType<'startConversation'>;
          console.log('conversationEntry', conversationEntry);
          if (!conversationEntry) throw new Error('Unexpected failure to start conversation');
          const relationships = nearbyPlayers.map((a) => ({
            name: a.player.name,
            relationship: a.relationship,
          }));
          const playerCompletion = await startConversation(relationships, memory, player);
          if (
            !(await actionAPI({
              type: 'talking',
              audience,
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

          const chatHistory = chatHistoryFromMessages(messages);
          const shouldWalkAway =
            (args.maxMessages && args.maxMessages >= messages.length) ||
            (await walkAway(chatHistory, player));

          if (shouldWalkAway) {
            walkawayCount++;
            await actionAPI({ type: 'leaveConversation', audience, conversationId });
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
