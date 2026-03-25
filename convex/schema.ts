import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { agentTables } from './agent/schema';
import { aiTownTables } from './aiTown/schema';
import { conversationId, playerId } from './aiTown/ids';
import { engineTables } from './engine/schema';

export default defineSchema({
  music: defineTable({
    storageId: v.string(),
    type: v.union(v.literal('background'), v.literal('player')),
  }),

  messages: defineTable({
    conversationId,
    messageUuid: v.string(),
    author: playerId,
    text: v.string(),
    worldId: v.optional(v.id('worlds')),
  })
    .index('conversationId', ['worldId', 'conversationId'])
    .index('messageUuid', ['conversationId', 'messageUuid']),

  townNews: defineTable({
    worldId: v.id('worlds'),
    dayIndex: v.number(),
    title: v.string(),
    summary: v.string(),
    rawEventCount: v.number(),
    generatedAt: v.number(),
  }).index('worldId', ['worldId', 'dayIndex']),

  activityEvents: defineTable({
    worldId: v.id('worlds'),
    agentId: v.string(),
    playerId: v.string(),
    type: v.string(),
    detail: v.string(),
    createdAt: v.number(),
  }).index('worldId', ['worldId', 'createdAt']),

  relationships: defineTable({
    worldId: v.id('worlds'),
    player1: v.string(),
    player2: v.string(),
    trustValue: v.number(),
    lastInteraction: v.number(),
    interactionCount: v.number(),
  }).index('edge', ['worldId', 'player1', 'player2']),

  userPrompts: defineTable({
    worldId: v.id('worlds'),
    playerId: v.string(),
    prompt: v.string(),
    status: v.string(),
    rejectReason: v.optional(v.string()),
    createdAt: v.number(),
  }).index('worldId', ['worldId', 'playerId']),

  // Agent future plans (LLM-generated)
  agentPlans: defineTable({
    worldId: v.id('worlds'),
    playerId: v.string(),
    plans: v.array(v.string()),
    generatedAt: v.number(),
  }).index('worldId', ['worldId', 'playerId']),

  // Political system — town votes
  townVotes: defineTable({
    worldId: v.id('worlds'),
    topic: v.string(),
    options: v.array(v.string()),
    votes: v.array(v.object({
      playerId: v.string(),
      option: v.string(),
      timestamp: v.number(),
    })),
    result: v.optional(v.string()),
    status: v.string(), // 'active' | 'closed'
    createdAt: v.number(),
    closedAt: v.optional(v.number()),
  }).index('worldId', ['worldId', 'status']),

  ...agentTables,
  ...aiTownTables,
  ...engineTables,
});
