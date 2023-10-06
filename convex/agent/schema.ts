import { memoryTables } from './memory';
import { defineTable } from 'convex/server';
import { v } from 'convex/values';
import { embeddingsCacheTables } from './embeddingsCache';

const agents = v.object({
  worldId: v.id('worlds'),
  playerId: v.id('players'),
  identity: v.string(),
  plan: v.string(),

  generationNumber: v.number(),

  // Set of in-progress inputs for the agent. The inputs in this
  // array last across runs of the agent, unlike the per-step
  // waits managed by the scheduling system below.
  inProgressInputs: v.array(v.object({ inputId: v.id('inputs'), submitted: v.number() })),
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
};
