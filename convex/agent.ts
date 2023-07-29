import { Infer, v } from 'convex/values';
import { api, internal } from './_generated/api.js';
import { Doc, Id } from './_generated/dataModel';
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server';
import { Entry, Agents, Memories, Memory, GameTs } from './schema.js';
import { Position, Pose, getRandomPosition, manhattanDistance } from './lib/physics.js';
import { MemoryDB, memoryDB } from './lib/memory.js';
import { chatGPTCompletion, fetchEmbedding } from './lib/openai.js';

export const Message = v.object({
  from: v.id('agents'),
  to: v.array(v.id('agents')),
  content: v.string(),
});
export type Message = Infer<typeof Message>;

export const Status = v.union(
  v.object({
    type: v.literal('talking'),
    otherAgentIds: v.array(v.id('agents')),
    conversationId: v.id('conversations'),
    messages: v.array(Message),
  }),
  v.object({
    type: v.literal('walking'),
    sinceTs: v.number(),
    route: v.array(Position),
    targetEndTs: v.number(),
  }),
  v.object({
    type: v.literal('stopped'),
    sinceTs: v.number(),
    reason: v.union(v.literal('interrupted'), v.literal('finished')),
  }),
  v.object({
    type: v.literal('thinking'),
    sinceTs: v.number(),
  }),
);
export type Status = Infer<typeof Status>;

export const Agent = v.object({
  id: v.id('agents'),
  name: v.string(),
  identity: v.string(),
  pose: Pose,
});
export type Agent = Infer<typeof Agent>;

export const Snapshot = v.object({
  agent: Agent,
  status: Status,
  plan: v.string(),
  // recentMemories: v.array(memoryValidator),
  nearbyAgents: v.array(v.object({ agent: Agent, new: v.boolean() })),
  ts: v.number(),
});
export type Snapshot = Infer<typeof Snapshot>;

export const Action = v.union(
  v.object({
    type: v.literal('startConversation'),
    audience: v.array(v.id('agents')),
    content: v.string(),
  }),
  v.object({
    type: v.literal('saySomething'),
    audience: v.array(v.id('agents')),
    content: v.string(),
    conversationId: v.id('conversations'),
  }),
  v.object({
    type: v.literal('travel'),
    position: Position,
  }),
  v.object({
    type: v.literal('continue'),
  }),
);
export type Action = Infer<typeof Action>;

export const runAgent = internalAction({
  args: { snapshot: Snapshot },
  handler: async (ctx, { snapshot }) => {
    const memory = memoryDB(ctx);
    const action = await agentLoop(snapshot, memory);
    await ctx.runMutation(internal.engine.handleAgentAction, {
      agentId: snapshot.agent.id,
      action,
      observedSnapshot: snapshot,
    });
  },
});

export async function agentLoop(
  { agent, nearbyAgents, status, ts }: Snapshot,
  memory: MemoryDB,
): Promise<Action> {
  const newFriends = nearbyAgents.filter((a) => a.new).map(({ agent }) => agent);
  // Future: Store observations about seeing agents?
  //  might include new observations -> add to memory with openai embeddings
  // Based on plan and observations, determine next action: if so, call AgentAPI
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
        // TODO: make a better prompt based on the user
        const { content: importanceRaw } = await chatGPTCompletion([
          { role: 'user', content: description },
          {
            role: 'user',
            content: 'How important is this? Answer on a scale of 0-10. Respond like: 5',
          },
        ]);
        const { embedding } = await fetchEmbedding(description);
        await memory.addMemory({
          agentId: agent.id,
          importance: parseFloat(importanceRaw),
          description,
          embedding,
          ts,
          data: {
            type: 'conversation',
            conversationId: status.conversationId,
          },
        });

        return { type: 'travel', position: getRandomPosition() };
      } else if (status.messages.at(-1)?.from === agent.id) {
        // We just said something.
        return { type: 'continue' };
      } else {
        // Assuming another person just said something.
        //   Future: ask who should talk next if it's 3+ people
        // TODO: real logic
        return {
          type: 'saySomething',
          audience: nearbyAgents.map(({ agent }) => agent.id),
          content: 'Interesting point',
          conversationId: status.conversationId,
        };
      }
    case 'walking':
      if (newFriends.length) {
        // Hey, new friends
        // TODO: decide whether we want to talk, and to whom.
        const { embedding } = await fetchEmbedding(`What do you think about ${newFriends[0].name}`);
        const memories = await memory.accessMemories(agent.id, embedding, ts);
        // TODO: actually do things with LLM completions.
        return {
          type: 'startConversation',
          audience: newFriends.map((a) => a.id),
          content: 'Hello',
        };
      } else if (manhattanDistance(agent.pose.position, status.route.at(-1)!)) {
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
