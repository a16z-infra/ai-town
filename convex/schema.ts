import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { Journal, Memories } from './types';

export default defineSchema({
  worlds: defineTable({}),
  players: defineTable({
    name: v.string(),
    worldId: v.id('worlds'),
  }).index('by_worldId', ['worldId']),
  journal: Journal.table
    .index('by_playerId_type_ts', ['playerId', 'data.type', 'ts'])
    .index('by_conversation', ['data.conversationId', 'ts']),

  memories: Memories.table
    .index('by_playerId_embeddingId', ['playerId', 'embeddingId', 'ts'])
    .index('by_playerId_type_ts', ['playerId', 'data.type', 'ts']),

  // To track recent accesses
  memoryAccesses: defineTable({
    memoryId: v.id('memories'),
  }).index('by_memoryId', ['memoryId']),

  embeddings: defineTable({
    playerId: v.id('players'),
    text: v.string(),
    embedding: v.array(v.number()),
  })
    .vectorIndex('embedding', {
      vectorField: 'embedding',
      filterFields: ['playerId'],
      dimension: 1536,
    })
    // To avoid recomputing embeddings, we can use this table as a cache.
    // IMPORTANT: don't re-use the object, as it has a reference to the playerId.
    // Just copy the embedding to a new document when needed.
    .index('by_text', ['text']),

  // Something for messages to associate with, can store
  // read-only metadata here in the future.
  conversations: defineTable({ worldId: v.id('worlds') }).index('by_worldId', ['worldId']),
});
