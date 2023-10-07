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
  maps: defineTable({
    width: v.number(),
    height: v.number(),

    tileSetUrl: v.string(),
    //  Width & height of tileset image, px (assume square)
    tileSetDim: v.number(),
    // Tile size in pixels (assume square)
    tileDim: v.number(),
    bgTiles: v.array(v.array(v.array(v.number()))),
    objectTiles: v.array(v.array(v.number())),
  }),

  music: defineTable({
    storageId: v.string(),
    type: v.union(v.literal('background'), v.literal('player')),
  }),

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
