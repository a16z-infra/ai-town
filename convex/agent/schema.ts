import { memoryTables } from './memory';
import { defineTable } from 'convex/server';
import { v } from 'convex/values';
import { embeddingsCacheTables } from './embeddingsCache';

const agents = v.object({
  engineId: v.id('engines'),
  playerId: v.id('players'),
  identity: v.string(),
  plan: v.string(),

  generationNumber: v.number(),
});

export const agentTables = {
  agents: defineTable(agents).index('playerId', ['playerId']).index('engineId', ['engineId']),
  ...memoryTables,
  ...embeddingsCacheTables,
};
