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
    .index('messageUuid', ['conversationId', 'messageUuid'])
    // Convex appends `_creationTime` to every index, so an index on `worldId` alone
    // yields a town-wide message feed in chronological order (used by the analytics live tail).
    .index('worldId', ['worldId'])
    .searchIndex('text', {
      searchField: 'text',
      filterFields: ['worldId', 'author'],
    }),

  ...agentTables,
  ...aiTownTables,
  ...engineTables,
});
