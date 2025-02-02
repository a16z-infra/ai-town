import { v } from 'convex/values';
import { defineTable } from 'convex/server';
import { serializedPlayer } from './player';
import { serializedPlayerDescription } from './playerDescription';
import { serializedAgent } from './agent';
import { serializedAgentDescription } from './agentDescription';
import { serializedWorld } from './world';
import { serializedWorldMap } from './worldMap';
import { serializedConversation } from './conversation';
import { conversationId, playerId } from './ids';
import { animatedSprites } from '../../data/maps/mage3';

export const aiTownTables = {
  // This table has a single document that stores all players, conversations, and agents. This
  // data is small and changes regularly over time.
  worlds: defineTable({ ...serializedWorld }),

  // Worlds can be started or stopped by the developer or paused for inactivity, and this
  // infrequently changing document tracks this world state.
  worldStatus: defineTable({
    worldId: v.id('worlds'),
    isDefault: v.boolean(),
    engineId: v.id('engines'),
    lastViewed: v.number(),
    status: v.union(v.literal('running'), v.literal('stoppedByDeveloper'), v.literal('inactive')),
  }).index('worldId', ['worldId']),

  // This table contains the map data for a given world. Since it's a bit larger than the player
  // state and infrequently changes, we store it in a separate table.
  maps: defineTable({
    worldId: v.id('worlds'),
    ...serializedWorldMap,
  }).index('worldId', ['worldId']),

  // Human readable text describing players and agents that's stored in separate tables, just like `maps`.
  playerDescriptions: defineTable({
    worldId: v.id('worlds'),
    ...serializedPlayerDescription,
  }).index('worldId', ['worldId', 'playerId']),
  agentDescriptions: defineTable({
    worldId: v.id('worlds'),
    ...serializedAgentDescription,
  }).index('worldId', ['worldId', 'agentId']),

  //The game engine doesn't want to track players that have left or conversations that are over, since
  // it wants to keep its managed state small. However, we may want to look at old conversations in the
  // UI or from the agent code. So, whenever we delete an entry from within the world's document, we
  // "archive" it within these tables.
  archivedPlayers: defineTable({ worldId: v.id('worlds'), ...serializedPlayer }).index('worldId', [
    'worldId',
    'id',
  ]),
  archivedConversations: defineTable({
    worldId: v.id('worlds'),
    id: conversationId,
    creator: playerId,
    created: v.number(),
    ended: v.number(),
    lastMessage: serializedConversation.lastMessage,
    numMessages: serializedConversation.numMessages,
    participants: v.array(playerId),
  }).index('worldId', ['worldId', 'id']),
  archivedAgents: defineTable({ worldId: v.id('worlds'), ...serializedAgent }).index('worldId', [
    'worldId',
    'id',
  ]),

  // The agent layer wants to know what the last (completed) conversation was between two players,
  // so this table represents a labelled graph indicating which players have talked to each other.
  participatedTogether: defineTable({
    worldId: v.id('worlds'),
    conversationId,
    player1: playerId,
    player2: playerId,
    ended: v.number(),
  })
    .index('edge', ['worldId', 'player1', 'player2', 'ended'])
    .index('conversation', ['worldId', 'player1', 'conversationId'])
    .index('playerHistory', ['worldId', 'player1', 'ended']),
};
