import { v } from 'convex/values';
import { defineTable } from 'convex/server';
import { playerDescriptionFields, playerFields } from './player';
import { agentDescriptionFields, agentFields } from './agent';
import { worldFields, worldMapFields } from './world';
import { conversationFields } from './conversation';
import { conversationId, playerId } from './ids';

export const aiTownTables = {
  worlds: defineTable({ ...worldFields }),
  worldStatus: defineTable({
    worldId: v.id('worlds'),
    isDefault: v.boolean(),
    engineId: v.id('engines'),
    lastViewed: v.number(),
    status: v.union(v.literal('running'), v.literal('stoppedByDeveloper'), v.literal('inactive')),
  }).index('worldId', ['worldId']),

  // Store the larger data for player, agent, and world descriptions
  // in separate tables.
  playerDescriptions: defineTable({ worldId: v.id('worlds'), ...playerDescriptionFields }).index(
    'worldId',
    ['worldId', 'playerId'],
  ),
  agentDescriptions: defineTable({
    worldId: v.id('worlds'),
    ...agentDescriptionFields,
  }).index('worldId', ['worldId', 'agentId']),
  maps: defineTable({
    worldId: v.id('worlds'),
    ...worldMapFields,
  }).index('worldId', ['worldId']),

  // Store inactive players, agents, and conversations in separate tables to keep
  // the core game state small.
  archivedPlayers: defineTable({ worldId: v.id('worlds'), ...playerFields }).index('worldId', [
    'worldId',
    'id',
  ]),
  archivedConversations: defineTable({
    worldId: v.id('worlds'),
    id: conversationId,
    creator: playerId,
    created: v.number(),
    ended: v.number(),
    lastMessage: conversationFields.lastMessage,
    numMessages: conversationFields.numMessages,
    participants: v.array(playerId),
  }).index('worldId', ['worldId', 'id']),

  // Store an undirected graph of who were in the same archived conversations together.
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

  archivedAgents: defineTable({ worldId: v.id('worlds'), ...agentFields }).index('worldId', [
    'worldId',
    'id',
  ]),
};
