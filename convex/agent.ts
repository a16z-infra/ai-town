// TODO: use node once vector search is available there, or w/ Pinecone
// 'use node';
// ^ This tells Convex to run this in a `node` environment.
// Read more: https://docs.convex.dev/functions/runtimes
import { v } from 'convex/values';
import { internal } from './_generated/api';
import { Doc, Id } from './_generated/dataModel';

import { internalAction } from './_generated/server';
import { MemoryDB } from './lib/memory';
import { Message } from './lib/openai';
import { Snapshot, Action, Position, Worlds, EntryOfType } from './types';
import { converse, startConversation, walkAway } from './conversation';

export type ActionAPI = (action: Action) => Promise<Doc<'journal'> | null>;
// 1. The engine kicks off this action.
export const runAgent = internalAction({
  args: {
    snapshot: Snapshot,
    world: Worlds.doc,
    thinkId: v.id('journal'),
    noSchedule: v.optional(v.boolean()),
  },
  handler: async (ctx, { snapshot, world, thinkId, noSchedule }) => {
    const memory = MemoryDB(ctx);
    const actionAPI = (action: Action) =>
      ctx.runMutation(internal.engine.handleAgentAction, {
        playerId: snapshot.player.id,
        action,
        noSchedule,
      });

    try {
      // 2. We run the agent loop
      await agentLoop(snapshot, memory, actionAPI, world);
    } finally {
      // should only be called from here, to match the "thinking" entry.
      // 3. We mark the agent as done
      await actionAPI({ type: 'done', thinkId });
    }
  },
});

export async function agentLoop(
  { player, nearbyPlayers, nearbyConversations, lastPlan }: Snapshot,
  memory: MemoryDB,
  actionAPI: ActionAPI,
  world: Doc<'worlds'>,
) {
  const imWalkingHere = player.motion.type === 'walking';
  const newFriends = nearbyPlayers.filter((a) => a.new).map(({ player }) => player);
  const othersThinking = newFriends.find((a) => a.thinking);
  const nearbyPlayerIds = nearbyPlayers.map(({ player }) => player.id);
  // Handle new observations
  //   Calculate scores
  //   If there's enough observation score, trigger reflection?
  // Wait for new memories before proceeding
  // Future: Store observations about seeing players?
  //  might include new observations -> add to memory with openai embeddings
  // Based on plan and observations, determine next action:
  //   if so, add new memory for new plan, and return new action

  // Check if any messages are from players still nearby.
  let relevantConversations = nearbyConversations.filter(
    (c) => c.messages.filter((m) => nearbyPlayerIds.includes(m.from)).length,
  );
  const lastConversation = relevantConversations.find(
    (c) => c.conversationId === player.lastSpokeConversationId,
  );
  if (lastConversation) {
    relevantConversations = [lastConversation];
  } else {
    if (player.lastSpokeConversationId) {
      // If we aren't part of a conversation anymore, remember it.
      await actionAPI({
        type: 'leaveConversation',
        conversationId: player.lastSpokeConversationId,
      });
      await memory.rememberConversation(
        player.name,
        player.id,
        player.identity,
        player.lastSpokeConversationId,
        player.lastSpokeTs,
      );
    }
  }

  for (const { conversationId, messages } of relevantConversations) {
    const chatHistory: Message[] = [
      ...messages.map((m) => ({
        role: 'user' as const,
        content: `${m.fromName} to ${m.toNames.join(',')}: ${m.content}\n`,
      })),
    ];
    const shouldWalkAway = await walkAway(chatHistory, player);
    console.log('shouldWalkAway: ', shouldWalkAway);

    // Decide if we keep talking.
    if (shouldWalkAway || messages.length >= 10) {
      // It's to chatty here, let's go somewhere else.
      if (!imWalkingHere) {
        await actionAPI({ type: 'leaveConversation', conversationId });
        await memory.rememberConversation(
          player.name,
          player.id,
          player.identity,
          conversationId,
          player.lastSpokeTs,
        );
        if (await actionAPI({ type: 'travel', position: getRandomPosition(world) })) {
          return;
        }
      }
      break;
    } else if (messages.at(-1)?.from !== player.id) {
      // Let's stop and be social
      if (imWalkingHere) {
        await actionAPI({ type: 'stop' });
      }

      const playerCompletion = await converse(chatHistory, player, nearbyPlayers, memory);
      // display the chat via actionAPI
      await actionAPI({
        type: 'talking',
        audience: nearbyPlayers.map(({ player }) => player.id),
        content: playerCompletion,
        conversationId: conversationId,
      });
      // Now that we're remembering the conversation overall,
      // don't store every message. We'll have the messages history for that.
      // await memory.addMemories([
      //   {
      //     playerId: player.id,
      //     description: playerCompletion,
      //     ts: Date.now(),
      //     data: {
      //       type: 'conversation',
      //       conversationId: conversationId,
      //     },
      //   },
      // ]);

      // Only message in one conversation
      return;
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

      const conversationEntry = (await actionAPI({
        type: 'startConversation',
        audience: newFriends.map((a) => a.id),
      })) as EntryOfType<'startConversation'>;
      if (conversationEntry) {
        // We won the race to start the conversation
        const newFriendsNames = newFriends.map((a) => a.name);
        const playerCompletion = await startConversation(newFriendsNames, memory, player);
        await actionAPI({
          type: 'talking',
          audience: newFriends.map((a) => a.id),
          content: playerCompletion,
          conversationId: conversationEntry.data.conversationId,
        });
        return;
      }
    }
  }
  if (!imWalkingHere) {
    // TODO: make a better plan
    const success = await actionAPI({ type: 'travel', position: getRandomPosition(world) });
    if (success) {
      return;
    }
  }
  // Otherwise I guess just keep walking?
  // TODO: consider reflecting on recent memories
}

export function getRandomPosition(world: Doc<'worlds'>): Position {
  return {
    x: Math.floor(Math.random() * world.width),
    y: Math.floor(Math.random() * world.height),
  };
}
