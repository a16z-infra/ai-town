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
    tileSetDimX: v.number(),
    tileSetDimY: v.number(),
    // Tile size in pixels (assume square)
    tileDim: v.number(),
    bgTiles:     v.array(v.array(v.array(v.number()))),
    objectTiles: v.array(v.array(v.array(v.number()))),
    spriteTiles: v.array(v.object({
      x : v.number(),
      y : v.number(),
      w : v.number(),
      h : v.number(),
      layer : v.number(),
      sheet : v.string(),
      animation : v.string(),
    })),
  }),

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
