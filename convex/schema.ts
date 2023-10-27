import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { agentTables } from './agent/schema';
import { aiTownTables } from './aiTown/schema';
import { conversationId, playerId } from './aiTown/ids';
import { engineTables } from './engine/schema';

export default defineSchema({
  sessions: defineTable({
    userId: v.optional(v.id('users')),
  }),

  users: defineTable({}),

  music: defineTable({
    storageId: v.string(),
    type: v.union(v.literal('background'), v.literal('player')),
  }),

  messages: defineTable({
    conversationId,
    messageUuid: v.string(),
    author: playerId,
    text: v.string(),
  })
    .index('conversationId', ['conversationId'])
    .index('messageUuid', ['conversationId', 'messageUuid']),

  ...agentTables,
  ...aiTownTables,
  ...engineTables,
});
