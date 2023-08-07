// TODO: use node once vector search is available there, or w/ Pinecone
// 'use node';
// ^ This tells Convex to run this in a `node` environment.
// Read more: https://docs.convex.dev/functions/runtimes
import { v } from 'convex/values';
import { internal } from './_generated/api';
import { Doc, Id } from './_generated/dataModel';

import { internalAction } from './_generated/server';
import { MemoryDB } from './lib/memory';
import { Snapshot, Action, Position, Worlds, EntryOfType } from './types';
import { chatHistoryFromMessages, converse, startConversation, walkAway } from './conversation';

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
  const imWalkingHere = player.motion.type === 'walking' && player.motion.targetEndTs > Date.now();
  const newFriends = nearbyPlayers.filter((a) => a.new).map(({ player }) => player);
  const nearbyPlayerIds = nearbyPlayers.map(({ player }) => player.id);
  // Handle new observations
  //   Calculate scores
  //   If there's enough observation score, trigger reflection?
  // Wait for new memories before proceeding
  // Future: Store observations about seeing players?
  //  might include new observations -> add to memory with openai embeddings
  // Based on plan and observations, determine next action:
  //   if so, add new memory for new plan, and return new action

  let relevantConversations = nearbyConversations;
  if (player.lastChat && player.lastChat.message.type !== 'left') {
    const lastConversation = nearbyConversations.find(
      (c) => c.conversationId === player.lastChat?.conversationId,
    );
    if (lastConversation) {
      relevantConversations = [lastConversation];
    } else {
      // If we aren't part of a conversation anymore, remember it.
      await actionAPI({
        type: 'leaveConversation',
        conversationId: player.lastChat.conversationId,
        audience: nearbyPlayerIds,
      });
      await memory.rememberConversation(
        player.name,
        player.id,
        player.identity,
        player.lastChat.conversationId,
        player.lastChat.message.ts,
      );
    }
  }

  let stopped = false;
  for (const { conversationId, messages } of relevantConversations) {
    if (imWalkingHere && messages.at(-1)!.to.includes(player.id)) {
      // If we're walking, and someone said something to us, stop.
      await actionAPI({ type: 'stop' });
      stopped = true;
    }
    if (messages.length === 1 && messages[0].type === 'started') {
      // If someone started a conversation, don't reply to it first.
      continue;
    }
    const chatHistory = chatHistoryFromMessages(messages);
    const shouldWalkAway = await walkAway(chatHistory, player);
    console.log('shouldWalkAway: ', shouldWalkAway);

    // Decide if we keep talking.
    if (shouldWalkAway) {
      // It's to chatty here, let's go somewhere else.
      await actionAPI({ type: 'leaveConversation', audience: nearbyPlayerIds, conversationId });
      await memory.rememberConversation(
        player.name,
        player.id,
        player.identity,
        conversationId,
        player.lastChat?.message.ts,
      );
      continue;
    }
    if (messages.at(-1)?.from !== player.id) {
      const playerCompletion = await converse(chatHistory, player, nearbyPlayers, memory);
      // display the chat via actionAPI
      await actionAPI({
        type: 'talking',
        // TODO: should we avoid talking to players in active conversation?
        audience: nearbyPlayerIds,
        content: playerCompletion,
        conversationId: conversationId,
      });
      // Only message in one conversation
      return;
    }
    // We sent a message, let's wait for a reply.
  }

  // We didn't say anything in a conversation yet.
  if (newFriends.length) {
    // Let's stop and be social
    if (imWalkingHere && !stopped) {
      stopped = true;
      await actionAPI({ type: 'stop' });
    }
    const othersThinking = newFriends.find((a) => a.thinking);
    // Hey, new friends
    // Decide whether we want to talk
    const conversationEntry = (await actionAPI({
      type: 'startConversation',
      audience: newFriends.map((a) => a.id),
    })) as EntryOfType<'startConversation'>;
    if (conversationEntry) {
      // We won the race to start the conversation
      const relationships = nearbyPlayers.map((a) => ({
        name: a.player.name,
        relationship: a.relationship,
      }));
      const playerCompletion = await startConversation(relationships, memory, player);
      await actionAPI({
        type: 'talking',
        audience: newFriends.map((a) => a.id),
        content: playerCompletion,
        conversationId: conversationEntry.data.conversationId,
      });
      return;
    } else if (othersThinking) {
      // Wait for someone else to say something
      return;
    }
  }
  if (stopped) {
    if (player.motion.type !== 'walking') throw new Error('Expected to be walking');
    // Pick up where we were going beforehand
    if (await actionAPI({ type: 'travel', position: player.motion.route.at(-1)! })) {
      return;
    }
  }
  if (!imWalkingHere) {
    // TODO: go to a random location by name, not position.
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
