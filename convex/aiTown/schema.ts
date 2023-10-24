import { v } from 'convex/values';
import { defineTable } from 'convex/server';
import { playerDescriptionFields, playerFields } from './player';
import { agentDescriptionFields, agentFields } from './agent';
import { worldFields, worldMapFields } from './world';
import { conversationFields } from './conversation';
import { conversationId, playerId } from './ids';

export const aiTownTables = {
  worlds2: defineTable({ isDefault: v.boolean(), ...worldFields }),
  worldEngine: defineTable({ worldId: v.id('worlds2'), engineId: v.id('engines') }).index(
    'worldId',
    ['worldId'],
  ),

  // Store the larger data for player, agent, and world descriptions
  // in separate tables.
  playerDescriptions: defineTable({ worldId: v.id('worlds2'), ...playerDescriptionFields }).index(
    'worldId',
    ['worldId', 'playerId'],
  ),
  agentDescriptions: defineTable({
    worldId: v.id('worlds2'),
    ...agentDescriptionFields,
  }).index('worldId', ['worldId', 'agentId']),
  maps2: defineTable({
    worldId: v.id('worlds2'),
    ...worldMapFields,
  }).index('worldId', ['worldId']),

  // Store inactive players, agents, and conversations in separate tables to keep
  // the core game state small.
  archivedPlayers: defineTable({ worldId: v.id('worlds2'), ...playerFields }).index('worldId', [
    'worldId',
    'id',
  ]),
  archivedConversations: defineTable({
    worldId: v.id('worlds2'),
    id: conversationId,
    lastMessage: conversationFields.lastMessage,
    numMessages: conversationFields.numMessages,
    participants: v.array(playerId),
  }).index('worldId', ['worldId', 'id']),

  // Store an undirected graph of who were in the same archived conversations together.
  participatedTogether: defineTable({
    worldId: v.id('worlds2'),
    conversationId,
    player1: playerId,
    player2: playerId,
    ended: v.number(),
  }).index('edge', ['worldId', 'player1', 'player2', 'ended']),

  archivedAgents: defineTable({ worldId: v.id('worlds2'), ...agentFields }).index('worldId', [
    'worldId',
    'id',
  ]),
};
