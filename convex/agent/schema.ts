import { memoryTables } from './memory';
import { defineTable } from 'convex/server';
import { v } from 'convex/values';
import { embeddingsCacheTables } from './embeddingsCache';

const agents = v.object({
  worldId: v.id('worlds'),
  playerId: v.id('players'),
  identity: v.string(),
  plan: v.string(),

  isThinking: v.optional(v.object({ since: v.number() })),

  generationNumber: v.number(),
});

export const agentTables = {
  agents: defineTable(agents).index('playerId', ['playerId']).index('worldId', ['worldId']),
  ...memoryTables,
  ...embeddingsCacheTables,
};
