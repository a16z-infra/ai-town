import { defineSchema, defineTable } from 'convex/server';
import { gameTables } from './game/schema';
import { v } from 'convex/values';
import { agentTables } from './agent/schema';

export default defineSchema({
  worlds: defineTable({
    isDefault: v.boolean(),
    engineId: v.id('engines'),
    mapId: v.id('maps'),

    lastViewed: v.number(),
    status: v.union(v.literal('running'), v.literal('stoppedByDeveloper'), v.literal('inactive')),
  }).index('engineId', ['engineId']),

  music: defineTable({
    storageId: v.string(),
    type: v.union(v.literal('background'), v.literal('player')),
  }),

  messages: defineTable({
    conversationId: v.id('conversations'),
    messageUuid: v.string(),
    author: v.id('players'),
    text: v.string(),
  })
    .index('conversationId', ['conversationId'])
    .index('messageUuid', ['conversationId', 'messageUuid']),

  ...gameTables,
  ...agentTables,
});
