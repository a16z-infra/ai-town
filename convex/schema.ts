import { defineSchema, defineTable } from 'convex/server';
import { Infer, v } from 'convex/values';
import { tableAndDoc } from './lib/utils.js';

export const { table: memoriesTable, doc: memory } = tableAndDoc('memories', {
  agentId: v.id('agents'),
  idx: v.number(),
  description: v.string(),
  emojiSummary: v.string(),
  embeddingId: v.id('embeddings'),
  importance: v.number(),
  relatedMemoryIds: v.optional(v.array(v.id('memories'))),
  conversationId: v.optional(v.id('conversations')),
});
const memories = memoriesTable.index('embeddingId', ['embeddingId']);

// To track recent accesses
export const memoryAccesses = defineTable({
  memoryId: v.id('memories'),
}).index('memoryId', ['memoryId']);

export const embeddings = defineTable({
  agentId: v.id('agents'),
  text: v.string(),
  embedding: v.array(v.number()),
}).vectorIndex('embedding', {
  vectorField: 'embedding',
  filterFields: ['agentId'],
  dimension: 1536,
});

// TODO: move state into log -> memories?
export const { table: agents, doc: agent } = tableAndDoc('agents', {
  // Hierarchical location within tree
  location: v.array(v.string()),
  status: v.string(),
  summary: v.string(), // High level summary of agent
  objects: v.array(v.object({ id: v.id('objects'), action: v.string() })),
  lastObservation: v.number(),
});
export type Agent = Infer<typeof agent>;

export const { table: conversations } = tableAndDoc('conversations', {
  initiator: v.id('agents'),
  participants: v.array(v.id('agents')),
  location: v.array(v.string()),
  endTs: v.optional(v.number()),
});

export const { table: messages, doc: message } = tableAndDoc('messages', {
  conversationId: v.id('conversations'),
  agentId: v.id('agents'),
  text: v.string(),
  relatedMemories: v.array(v.id('memories')),
});

export default defineSchema(
  {
    memories,
    memoryAccesses,
    agents,
    conversations,
    messages,
    embeddings,
  },
  { schemaValidation: false },
);
