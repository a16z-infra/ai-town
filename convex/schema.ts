import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { agentTables } from './agent/schema';
import { aiTownTables } from './aiTown/schema';
import { conversationId, playerId } from './aiTown/ids';
import { pathfinding } from './aiTown/player';
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


  // Static agent data (immutable)
  agents_static: defineTable({
    worldId: v.id('worlds'),
    playerId: playerId, 
    // Ideally we would map this to the old agentId if needed, but for now strict 1:1 with player
    // We can keep agentId as optional if some players aren't agents
    agentId: v.optional(v.id('agents')), 
    name: v.string(),
    description: v.string(),
    character: v.string(),
    isHuman: v.optional(v.boolean()),
  }).index('worldId', ['worldId', 'playerId']),

  // High-frequency agent data for physics/movement (mutable, rapid updates)
  agents_dynamic: defineTable({
    worldId: v.id('worlds'),
    playerId: playerId,
    position: v.object({ x: v.number(), y: v.number() }),
    facing: v.object({ dx: v.number(), dy: v.number() }),
    speed: v.number(),
    destination: v.optional(v.object({ x: v.number(), y: v.number() })),
    // Spatial Hashing Key "X_Y"
    gridKey: v.string(),
    pathfinding: v.optional(pathfinding), 
    activity: v.optional(v.object({
        description: v.string(),
        emoji: v.string(),
        until: v.number(),
    })),
    lastInput: v.number(),
  })
    .index('by_grid', ['worldId', 'gridKey'])
    .index('by_world', ['worldId'])
    .index('by_player', ['worldId', 'playerId']),

  // Logical state (FSM, cognitive state)
  agents_state: defineTable({
    worldId: v.id('worlds'),
    playerId: playerId,
    agentId: v.id('agents'),
    toRemember: v.optional(conversationId),
    lastConversation: v.optional(v.number()),
    lastInviteAttempt: v.optional(v.number()),
    inProgressOperation: v.optional(v.any()), // Simplified for schema
    state: v.optional(v.string()), // IDLE, MOVING, CONVERSING, etc.
  })
    .index('worldId', ['worldId', 'playerId'])
    .index('by_agentId', ['agentId']),

  ...agentTables,
  ...aiTownTables,
  ...engineTables,
});
