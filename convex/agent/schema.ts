import { memoryTables } from './memory';
import { defineTable } from 'convex/server';
import { v } from 'convex/values';
import { embeddingsCacheTables } from './embeddingsCache';
import { agentWaitingOn, schedulingTables } from './scheduling';

const agents = v.object({
  worldId: v.id('worlds'),
  playerId: v.id('players'),
  identity: v.string(),
  plan: v.string(),

  generationNumber: v.number(),
  state: v.union(
    v.object({
      kind: v.literal('waiting'),
      timer: v.optional(v.number()),
    }),
    v.object({
      kind: v.literal('scheduled'),
    }),
    v.object({
      kind: v.literal('stopped'),
    }),
  ),
  // Last set of events the agent was waiting on for debugging.
  waitingOn: v.optional(v.array(agentWaitingOn)),
});

// Separate out this flag from `agents` since it changes a lot less
// frequently.
const agentIsThinking = v.object({
  playerId: v.id('players'),
  since: v.number(),
});

export const agentTables = {
  agents: defineTable(agents).index('playerId', ['playerId']).index('worldId', ['worldId']),
  agentIsThinking: defineTable(agentIsThinking).index('playerId', ['playerId']),
  ...memoryTables,
  ...embeddingsCacheTables,
  ...schedulingTables,
};
