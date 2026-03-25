import { v } from 'convex/values';
import { playerId, conversationId } from '../aiTown/ids';
import { defineTable } from 'convex/server';
import { EMBEDDING_DIMENSION } from '../util/llm';

export const memoryFields = {
  playerId,
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
      playerId,
    }),
    v.object({
      type: v.literal('conversation'),
      conversationId,
      // The other player(s) in the conversation.
      playerIds: v.array(playerId),
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
    playerId,
    embedding: v.array(v.float64()),
  }).vectorIndex('embedding', {
    vectorField: 'embedding',
    filterFields: ['playerId'],
    dimensions: EMBEDDING_DIMENSION,
  }),
};

// Short-term memory: recent events, FIFO, max ~20 per agent
export const shortTermMemoryFields = {
  playerId,
  type: v.string(), // 'conversation' | 'event' | 'perception' | 'interaction'
  content: v.string(),
  importance: v.number(), // 0-9
  timestamp: v.number(),
  // Optional metadata for promotion decisions
  relatedPlayerId: v.optional(playerId),
  sentiment: v.optional(v.number()), // -10 to +10
};

export const shortTermMemoryTable = {
  shortTermMemories: defineTable(shortTermMemoryFields)
    .index('playerId', ['playerId', 'timestamp'])
    .index('playerId_type', ['playerId', 'type', 'timestamp']),
};

export const agentTables = {
  ...memoryTables,
  ...shortTermMemoryTable,
  embeddingsCache: defineTable({
    textHash: v.bytes(),
    embedding: v.array(v.float64()),
  }).index('text', ['textHash']),
};
