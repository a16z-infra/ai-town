import { v } from 'convex/values';
import { api, internal } from './_generated/api';
import { Doc, Id } from './_generated/dataModel';
import {
  ActionCtx,
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server';
import { getRandomPosition, manhattanDistance } from './lib/physics';
import { MemoryDB } from './lib/memory';
import { chatGPTCompletion, fetchEmbedding } from './lib/openai';
import { Snapshot, Action } from './types';
import { getPlayerSnapshot } from './engine';

export const runConversation = action({
  args: { players: v.optional(v.array(v.id('players'))) },
  handler: async (ctx, args) => {
    // To always clear all first:
    await ctx.runAction(internal.init.seed, { reset: true });
    // To always make a new world:
    // await ctx.runAction(internal.init.seed, { newWorld: true });
    // To just run with the existing agents:
    // await ctx.runAction(internal.init.seed, {});
    let playerIds = args.players;
    if (!playerIds) {
      playerIds = await ctx.runQuery(internal.agent.getDebugPlayerIds);
    }
    for (let i = 0; i < 2; i++) {
      for (const playerId of playerIds) {
        const snapshot = await ctx.runMutation(internal.agent.debugPlanAgent, {
          playerId,
        });
        console.log('running ', snapshot.player.id, snapshot.player.name);
        await ctx.runAction(internal.agent.runAgent, { snapshot, noSchedule: true });
      }
    }
  },
});

export const debugPlanAgent = internalMutation({
  args: { playerId: v.id('players') },
  handler: async (ctx, { playerId }) => {
    const snapshot = await getPlayerSnapshot(ctx, { playerId });
    await ctx.db.insert('journal', {
      ts: Date.now(),
      playerId,
      data: {
        type: 'planning',
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

export async function agentLoop(
  { player, nearbyPlayers, nearbyConversations, lastPlan }: Snapshot,
  memory: MemoryDB,
  actionAPI: ActionAPI,
) {
  const imWalkingHere = player.motion.type === 'walking' && player.motion.targetEndTs > Date.now();
  const newFriends = nearbyPlayers.filter((a) => a.new).map(({ player }) => player);
  const othersThinking = newFriends.find((a) => a.thinking);
  // Handle new observations
  //   Calculate scores
  //   If there's enough observation score, trigger reflection?
  // Wait for new memories before proceeding
  // Future: Store observations about seeing players?
  //  might include new observations -> add to memory with openai embeddings
  // Based on plan and observations, determine next action:
  //   if so, add new memory for new plan, and return new action
  for (const { conversationId, messages } of nearbyConversations) {
    // Decide if we keep talking.
    if (messages.length >= 10) {
      // It's to chatty here, let's go somewhere else.
      if (!imWalkingHere) {
        if (await actionAPI({ type: 'travel', position: getRandomPosition() })) {
          return;
        }
      }
      break;
    } else if (messages.at(-1)?.from !== player.id) {
      // Let's stop and be social
      if (imWalkingHere) {
        await actionAPI({ type: 'stop' });
      }
      // We didn't just say something.
      // Assuming another person just said something.
      //   Future: ask who should talk next if it's 3+ people
      // TODO: real logic
      const success = await actionAPI({
        type: 'saySomething',
        audience: nearbyPlayers.map(({ player }) => player.id),
        content: 'Interesting point',
        conversationId: conversationId,
      });
      // Success might mean someone else said something first
      if (success) {
        // TODO: make a better prompt based on the user & relationship
        const { content: description } = await chatGPTCompletion([
          ...messages.map((m) => ({
            role: 'user' as const,
            content: m.content,
          })),
          {
            role: 'user',
            content: 'Can you summarize the above conversation?',
          },
        ]);
        await memory.addMemories([
          {
            playerId: player.id,
            description,
            ts: Date.now(),
            data: {
              type: 'conversation',
              conversationId: conversationId,
            },
          },
        ]);
        // Only message in one conversation
        return;
      }
    }
  }
  // We didn't say anything in a conversation yet.
  if (newFriends.length) {
    // Let's stop and be social
    if (imWalkingHere) {
      await actionAPI({ type: 'stop' });
    }
    // Hey, new friends
    if (!othersThinking) {
      // Decide whether we want to talk
      const { embedding } = await fetchEmbedding(`What do you think about ${newFriends[0].name}`);
      const memories = await memory.accessMemories(player.id, embedding);
      // TODO: actually do things with LLM completions.
      if (
        await actionAPI({
          type: 'startConversation',
          audience: newFriends.map((a) => a.id),
          content: 'Hello',
        })
      ) {
        return;
      }
    }
  }
  if (!imWalkingHere) {
    // TODO: make a better plan
    const success = await actionAPI({ type: 'travel', position: getRandomPosition() });
    if (success) {
      return;
    }
  }
  // Otherwise I guess just keep walking?
  // TODO: consider reflecting on recent memories
}

export const runAgent = internalAction({
  args: { snapshot: Snapshot, noSchedule: v.optional(v.boolean()) },
  handler: async (ctx, { snapshot, noSchedule }) => {
    const memory = MemoryDB(ctx);
    const actionAPI = ActionAPI(ctx, snapshot.player.id, noSchedule ?? false);
    await agentLoop(snapshot, memory, actionAPI);
    // continue should only be called from here, to match the "planning" entry.
    await actionAPI({ type: 'continue' });
  },
});

export function ActionAPI(ctx: ActionCtx, playerId: Id<'players'>, noSchedule: boolean) {
  return (action: Action) => {
    console.log('player ', playerId, ' attempting action ', action);
    return ctx.runMutation(internal.engine.handleAgentAction, {
      playerId,
      action,
      noSchedule,
    });
  };
}
export type ActionAPI = ReturnType<typeof ActionAPI>;
