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
import { MemoryDB } from './lib/memory.js';

export const Message = v.object({
  from: v.id('agents'),
  to: v.array(v.id('agents')),
  content: v.string(),
});
export type Message = Infer<typeof Message>;
// {
//   from: Id<'agents'>;
//   to: Id<'agents'>[];
//   content: string;
// };

export const Status = v.union(
  v.object({
    type: v.literal('talking'),
    otherAgentIds: v.array(v.id('agents')),
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
// | {
//     type: 'talking';
//     otherAgentIds: Id<'agents'>[];
//     messages: Message[];
//   }
// | {
//     type: 'walking';
//     sinceTs: GameTs;
//     route: Position[];
//     targetEndTs: GameTs;
//   }
// | {
//     type: 'stopped';
//     sinceTs: GameTs;
//     reason: 'interrupted' | 'finished';
//   }
// | {
//     sinceTs: GameTs;
//     type: 'thinking';
//   };

export const AgentFields = {
  id: v.id('agents'),
  name: v.string(),
  identity: v.string(),
  pose: Pose,
  status: Status,
  plan: v.string(),
};
export const Agent = v.object(AgentFields);
export type Agent = Infer<typeof Agent>;
// {
//   id: Id<'agents'>;
//   name: string;
//   identity: string; // Latest one, if multiple
//   pose: Pose;
//   status: Status;
//   // plan: string;
// };

export const Snapshot = {
  agent: Agent,
  // recentMemories: v.array(memoryValidator),
  nearbyAgents: v.array(v.object({ agent: Agent, sinceTs: v.number() })),
  ts: v.number(),
  lastPlanTs: v.number(),
};
const snapshotObject = v.object(Snapshot);
export type Snapshot = Infer<typeof snapshotObject>;
// {
//   agent: Agent;
//   recentMemories: Memory[];
//   nearbyAgents: { agent: Agent; sinceTs: GameTs }[];
//   ts: number;
//   lastPlanTs: number;
// };

export type Action =
  | {
      type: 'startConversation';
      audience: Id<'agents'>[];
      content: string;
    }
  | {
      type: 'saySomething';
      to: Id<'agents'>;
      content: string;
    }
  | {
      type: 'travel';
      position: Position;
    }
  | {
      type: 'continue';
    };

export async function agentLoop(
  { agent, nearbyAgents, ts, lastPlanTs }: Snapshot,
  memory: MemoryDB,
): Promise<Action> {
  const tsOffset = ts - Date.now();
  let havePlan = false;
  const newFriends = nearbyAgents.filter((a) => a.sinceTs > lastPlanTs);
  // At time ts
  // Based on plan and observations, determine next action: if so, call AgentAPI
  switch (agent.status.type) {
    case 'talking':
      // Decide if we keep talking.
      if (agent.status.messages.length >= 10) {
        // TODO: make a better plan
        return { type: 'travel', position: getRandomPosition() };
      } else {
        // Assuming one other person who just said something.
        // TODO: real logic
        return {
          type: 'saySomething',
          to: agent.status.messages.at(-1)!.from,
          content: 'Interesting point',
        };
      }
    case 'walking':
      if (newFriends.length) {
        // Hey, new friends
        // TODO: decide whether we want to talk, and to whom.
        return {
          type: 'startConversation',
          audience: newFriends.map((a) => a.agent.id),
          content: 'Hello',
        };
      } else if (manhattanDistance(agent.pose.position, agent.status.route.at(-1)!)) {
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
        return {
          type: 'startConversation',
          audience: newFriends.map((a) => a.agent.id),
          content: 'Hello',
        };
      } else {
        // TODO: make a better plan
        return { type: 'travel', position: getRandomPosition() };
      }
  }
}
