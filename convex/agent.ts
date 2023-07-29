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
import { Entry, Agents, Memories, Memory, GameTs, ts, Position, Pose } from './schema.js';
import { MemoryDB } from './lib/memory.js';

type Message = {
  from: Id<'agents'>;
  to: Id<'agents'>[];
  content: string;
};

type Agent = {
  id: Id<'agents'>;
  name: string;
  identity: string; // Latest one, if multiple
  pose: Pose;
  status: Status;
  plan: string;
};

type Status =
  | {
      type: 'talking';
      otherAgentIds: Id<'agents'>[];
      messages: Message[];
    }
  | {
      type: 'walking';
      startTs: GameTs;
      route: Position[];
      estEndTs: GameTs;
    }
  | {
      type: 'stopped';
      startTs: GameTs;
      reason: 'interrupted' | 'finished';
    }
  | {
      startTs: GameTs;
      type: 'thinking';
    };

export type Snapshot = {
  agent: Agent;
  recentMemories: Memory[];
  nearbyAgents: { agent: Agent; sinceTs: GameTs }[];
  ts: number;
  lastPlanTs: number;
};

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

function getRandomPosition(): Position {
  return { x: Math.floor(Math.random() * 100), y: Math.floor(Math.random() * 100) };
}

function manhattanDistance(p1: Position, p2: Position) {
  return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}

async function agentLoop(
  { agent, recentMemories, nearbyAgents, ts, lastPlanTs }: Snapshot,
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
