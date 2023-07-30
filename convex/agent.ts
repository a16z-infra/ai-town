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
import { getRandomPosition, manhattanDistance } from './lib/physics';
import { MemoryDB } from './lib/memory';
import { chatGPTCompletion, fetchEmbedding } from './lib/openai';
import { Snapshot, Action } from './types';

export const runAgent = internalAction({
  args: { snapshot: Snapshot },
  handler: async (ctx, { snapshot }) => {
    const memory = MemoryDB(ctx);
    const action = await agentLoop(snapshot, memory);
    await ctx.runMutation(internal.engine.handleAgentAction, {
      playerId: snapshot.player.id,
      action,
      // Not used now, but maybe it'd be useful later.
      // observedSnapshot: snapshot,
    });
  },
});

export async function agentLoop(
  { player, nearbyPlayers, status, plan }: Snapshot,
  memory: MemoryDB,
): Promise<Action> {
  const newFriends = nearbyPlayers.filter((a) => a.new).map(({ player }) => player);
  // Future: Store observations about seeing players?
  //  might include new observations -> add to memory with openai embeddings
  // Based on plan and observations, determine next action:
  //   if so, add new memory for new plan, and return new action
  switch (status.type) {
    case 'talking':
      // Decide if we keep talking.
      if (status.messages.length >= 10) {
        // TODO: make a better prompt based on the user & relationship
        const { content: description } = await chatGPTCompletion([
          ...status.messages.map((m) => ({
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
              conversationId: status.conversationId,
            },
          },
        ]);

        return { type: 'travel', position: getRandomPosition() };
      } else if (status.messages.at(-1)?.from === player.id) {
        // We just said something.
        return { type: 'continue' };
      } else {
        // Assuming another person just said something.
        //   Future: ask who should talk next if it's 3+ people
        // TODO: real logic
        return {
          type: 'saySomething',
          audience: nearbyPlayers.map(({ player }) => player.id),
          content: 'Interesting point',
          conversationId: status.conversationId,
        };
      }
    case 'walking':
      if (newFriends.length) {
        // Hey, new friends
        // TODO: decide whether we want to talk, and to whom.
        const { embedding } = await fetchEmbedding(`What do you think about ${newFriends[0].name}`);
        const memories = await memory.accessMemories(player.id, embedding);
        // TODO: actually do things with LLM completions.
        return {
          type: 'startConversation',
          audience: newFriends.map((a) => a.id),
          content: 'Hello',
        };
      } else if (manhattanDistance(player.pose.position, status.route.at(-1)!)) {
        // We've arrived.
        // TODO: make a better plan
        return { type: 'travel', position: getRandomPosition() };
      }
      // Otherwise I guess just keep walking?
      return { type: 'continue' };
    case 'stopped':
    case 'thinking':
      // TODO: consider reflecting on recent memories
      if (newFriends.length) {
        // Hey, new friends
        // TODO: decide whether we want to talk, and to whom.
        // TODO: actually do things with LLM completions.
        return {
          type: 'startConversation',
          audience: newFriends.map((a) => a.id),
          content: 'Hello',
        };
      } else {
        // TODO: make a better plan
        return { type: 'travel', position: getRandomPosition() };
      }
  }
}
