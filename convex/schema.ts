import { defineSchema, defineTable } from 'convex/server';
import { Infer, v } from 'convex/values';
import { tableHelper } from './lib/utils.js';

// ts is milliseconds in game time
export const ts = v.number();
export type GameTs = Infer<typeof ts>;

// Hierarchical location within tree
export const location = v.array(v.string());
export type Location = Infer<typeof location>;

export const Agents = tableHelper('agents', {
  name: v.string(),
  cursor: v.number(), // Last time agent loop processed
  nextActionTs: v.number(), // When to run next action
});

export const Memories = tableHelper('memories', {
  agentId: v.id('agents'),
  description: v.string(),
  embeddingId: v.id('embeddings'),
  importance: v.number(),
  ts,
  data: v.union(
    // Useful for seed memories, high level goals
    v.object({
      type: v.literal('identity'),
    }),
    // Setting up dynamics between agents
    v.object({
      type: v.literal('relationship'),
      agentId: v.id('agents'),
    }),
    // Per-agent summary of recent observations
    // Can start out all the same, but could be dependent on personality
    v.object({
      type: v.literal('conversation'),
      coversationId: v.id('conversations'),
    }),

    // Exercises left to the reader:

    // v.object({
    //   type: v.literal('reflection'),
    //   relatedMemoryIds: v.array(v.id('memories')),
    // }),
    // v.object({
    //   type: v.literal('observation'),
    //   object: v.string(),
    //   location,
    // }),
    // Seemed too noisey for every message for every party, but maybe?
    // v.object({
    //   type: v.literal('message'),
    //   messageId: v.id('messages'),
    //   relatedMemoryIds: v.optional(v.array(v.id('memories'))),
    // }),
    // Could be a way to have the agent reflect and change identities
  ),
});
export type Memory = Infer<typeof Memories.doc>;

// Journal documents are append-only, and define an agent's state.
export const Journal = tableHelper('journal', {
  ts,
  // Could be extended to non-agent actors
  actorId: v.id('agents'),
  // emojiSummary: v.string(),
  data: v.union(
    v.object({
      type: v.literal('talking'),
      // If they are speaking to a person in particular.
      // If it's empty, it's just talking out loud.
      audience: v.array(v.id('agents')),
      content: v.string(),
      firstMessage: v.id('journal'),
      relatedMemories: v.array(v.id('memories')),
    }),
    v.object({
      type: v.literal('stopped'),
      reason: v.union(v.literal('interrupted'), v.literal('finished')),
      location,
    }),
    v.object({
      type: v.literal('walking'),
      route: v.array(location),
      targetEndTs: v.number(),
    }),

    // Exercises left to the reader:

    // v.object({
    //   type: v.literal('thinking'),
    // }),
    // v.object({
    //   type: v.literal('activity'),
    //   description: v.string(),
    // 	// objects: v.array(v.object({ id: v.id('objects'), action: v.string() })),
    //   location,
    // }),
  ),
});
export type Entry = Infer<typeof Journal.doc>;

export default defineSchema({
  agents: Agents.table.index('by_cursor', ['cursor']),
  journal: Journal.table.index('by_agentId_type_ts', ['actorId', 'data.type', 'ts']),

  memories: Memories.table
    .index('by_embeddingId', ['embeddingId', 'ts'])
    .index('by_type_ts', ['data.type', 'ts']),

  // To track recent accesses
  memoryAccesses: defineTable({
    memoryId: v.id('memories'),
    ts,
  }).index('by_memoryId', ['memoryId']),

  embeddings: defineTable({
    agentId: v.id('agents'),
    embedding: v.array(v.number()),
  }).vectorIndex('embedding', {
    vectorField: 'embedding',
    filterFields: ['agentId'],
    dimension: 1536,
  }),

  // To avoid recomputing embeddings
  embeddingCache: defineTable({
    text: v.string(),
    embeddingId: v.id('embeddings'),
  }).index('by_text', ['text']),
});
