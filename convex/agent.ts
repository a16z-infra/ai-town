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

interface AgentAPI {
  startConversation(
    agentId: Id<'agents'>,
    audience: Id<'agents'>[],
    content: string,
  ): Promise<boolean>;
  saySomething(agentId: Id<'agents'>, to: Id<'agents'>, content: string): Promise<boolean>;
  travel(agentId: Id<'agents'>, location: Location): Promise<boolean>;
}

export const focusAttention = mutation({
  args: {
    agentId: v.id('agents'),
  },
  handler: async (ctx, args) => {
    // ensure one action running per agent
    // coordinate shared interactions (shared focus)
    // handle timeouts
    // handle object ownership?
  },
});

//What triggers another loop:
// 1. New observation
// 2.
export const worldLoop = internalAction({
  args: {
    agents: v.array(Agents.doc),
    recentObservations: v.array(Memories.doc),
    ts,
    lastTs: ts,
  },
  handler: async (ctx, args) => {
    // At time ts

    // For each agent (oldest to newest? Or all on the same step?):
    //  fetch params: nearby agent states, memories, messages
    // ^ can happen in mutation
    //  might include new observations -> add to memory with openai embeddings
    //   Future: ask who should talk next if it's 3+ people
    //  run agent loop
    //  if starts a conversation, ... see it through? just send one?
    //   If dialog, focus attention of other agent(s)
    //     Creates a conversation stream
    //  If move, update path plan
    //    Scan for upcoming collisions (including objects for new observations)
    //  Update agent cursor seen and nextActionTs
    // Handle new observations
    //   Calculate scores
    //   If there's enough observation score, trigger reflection?
    return 'hello';
  },
});

async function agentLoop(
  agent: Agent,
  recentMemories: Memory[],
  nearbyAgents: { agent: Agent; sinceTs: GameTs }[],
  memory: MemoryDB,
  actions: AgentAPI,
  ts: number,
  lastTs: number,
) {
  // At time ts
  // Based on plan and observations, determine next action: if so, call AgentAPI
  // Talk to someone who arrived since lastTs?
  // Say something if in an active conversation? (agent.status.messages)
  // End conversation?
  // Move to a new location?
}

// async function haveConversation(agents: Agent[], memory: MemoryDB) {}

function getAgentStatus(entries: Entry[] /* latest first */) {}
