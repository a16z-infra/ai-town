import { defineSchema, defineTable } from 'convex/server';
import { gameTables } from './game/schema';
import { worlds } from './world';
import { v } from 'convex/values';
import { agentTables } from './agent/schema';

export default defineSchema({
  worlds,

  typingIndicator: defineTable({
    conversationId: v.id('conversations'),
    typing: v.optional(v.object({ playerId: v.id('players'), since: v.number() })),
    versionNumber: v.number(),
  }).index('conversationId', ['conversationId']),
  messages: defineTable({
    conversationId: v.id('conversations'),
    author: v.id('players'),
    text: v.string(),
  }).index('conversationId', ['conversationId']),

  ...gameTables,
  ...agentTables,
});
