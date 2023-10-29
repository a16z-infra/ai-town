import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const memoryFields = {
  playerId: v.id('players'),
  description: v.string(),
  embeddingId: v.id('memoryEmbeddings'),
  importance: v.number(),
  lastAccess: v.number(),
  data: v.union(
    // Setting up dynamics between players
    v.object({
      type: v.literal('relationship'),
      // The player this memory is about, from the perspective of the player
      // whose memory this is.
      playerId: v.id('players'),
    }),
    v.object({
      type: v.literal('conversation'),
      conversationId: v.id('conversations'),
      // The other player(s) in the conversation.
      playerIds: v.array(v.id('players')),
    }),
    v.object({
      type: v.literal('reflection'),
      relatedMemoryIds: v.array(v.id('memories')),
    }),
  ),
};

export const memoryTables = {
  memories: defineTable(memoryFields)
    .index('embeddingId', ['embeddingId'])
    .index('playerId_type', ['playerId', 'data.type'])
    .index('playerId', ['playerId']),
  memoryEmbeddings: defineTable({
    playerId: v.id('players'),
    embedding: v.array(v.float64()),
  }).vectorIndex('embedding', {
    vectorField: 'embedding',
    filterFields: ['playerId'],
    dimensions: 1536,
  }),
};
