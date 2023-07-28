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
import { Agent, agent, memory } from './schema.js';
import { getAll } from './lib/utils.js';
import { MemoryDB } from './lib/vector.js';

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
    agents: v.array(agent),
    recentObservations: v.array(memory),
  },
  handler: async (ctx, args) => {
    // At time t
    // Based on plan and observations, determine next action: replan, continue plan
    //   Update lastObservation seen and new status
    //   If dialog, focus attention of other agent(s)
    //     Creates a conversation stream
    //   If move, update path plan
    //     Scan for upcoming collisions (including objects for new observations)
    // Handle new observations
    //   Calculate scores
    //   If there's enough observation score, trigger reflection?
    return 'hello';
  },
});

// async function onMessage(agent: Agent, message: )

// async function haveConversation(agents: Agent[], memory: MemoryDB) {}
