import { v } from 'convex/values';
import { defineTable } from 'convex/server';
import { serializedAgent } from './agent';
import { serializedAgentDescription } from './agentDescription';
import { serializedWorld } from './world';
import { serializedWorldMap } from './worldMap';
import { serializedTransaction } from './transaction';
import { agentId, transactionId, zoneId } from './ids';

// ═══════════════════════════════════════════════════════════════════════════════
// X402 WORLD SCHEMA
// Adapted from ai-town for autonomous agent commerce on Solana
//
// PHILOSOPHY (from Gas Town → X402 World):
// - Gas Town runs on guzzoline → X402 World runs on USDC micropayments
// - Polecats hunt work → Nodes hunt alpha & execute transactions
// - Convoys bundle work → Caravans bundle agent transactions
// - The Refinery processes → The Mixer aggregates & routes
// - GUPP daemon runs hooks → XAPI daemon orchestrates A2A payments
// ═══════════════════════════════════════════════════════════════════════════════

export const x402WorldTables = {
  // ═══════════════════════════════════════════════════════════════════════════════
  // CORE WORLD STATE
  // ═══════════════════════════════════════════════════════════════════════════════

  // Main world document - stores all active agents, transactions, zones
  worlds: defineTable({ ...serializedWorld }),

  // World operational status - running, paused, maintenance
  worldStatus: defineTable({
    worldId: v.id('worlds'),
    isDefault: v.boolean(),
    engineId: v.id('engines'),
    lastViewed: v.number(),
    status: v.union(
      v.literal('running'),
      v.literal('paused'),
      v.literal('maintenance'),
      v.literal('upgrading'),
      v.literal('inactive') // Legacy status from old deployments
    ),
    // X402 Protocol Status (optional for migration from old data)
    protocolVersion: v.optional(v.string()),
    networkStatus: v.optional(v.union(v.literal('connected'), v.literal('degraded'), v.literal('offline'))),
    lastBlockHeight: v.optional(v.number()),
  })
    .index('worldId', ['worldId'])
    .index('isDefault', ['isDefault']),

  // ═══════════════════════════════════════════════════════════════════════════════
  // WORLD MAP & ZONES
  // ═══════════════════════════════════════════════════════════════════════════════

  // World map with zones (adapted from Gas Town's geography)
  maps: defineTable({
    worldId: v.id('worlds'),
    ...serializedWorldMap,
  }).index('worldId', ['worldId']),

  // Zones are functional areas within X402 World (like Gas Town's districts)
  zones: defineTable({
    worldId: v.id('worlds'),
    id: zoneId,
    name: v.string(),
    type: v.union(
      v.literal('nexus'),        // Central hub - The Oracle resides here
      v.literal('exchange'),     // Trading floor - DEX interactions
      v.literal('forge'),        // Where new agents are minted
      v.literal('archive'),      // Historical data & memory storage
      v.literal('gateway'),      // External API connections
      v.literal('vault'),        // Treasury & escrow
      v.literal('lab'),          // Experimentation & strategy testing
      v.literal('commons')       // General interaction space
    ),
    position: v.object({ x: v.number(), y: v.number() }),
    radius: v.number(),
    capacity: v.number(),
    currentOccupancy: v.number(),
    feeMultiplier: v.number(),   // Zone-based fee adjustments
    permissions: v.array(v.string()),
  }).index('worldId', ['worldId', 'id']),

  // ═══════════════════════════════════════════════════════════════════════════════
  // AGENT DESCRIPTIONS & METADATA
  // ═══════════════════════════════════════════════════════════════════════════════

  agentDescriptions: defineTable({
    worldId: v.id('worlds'),
    ...serializedAgentDescription,
  }).index('worldId', ['worldId', 'agentId']),

  // ═══════════════════════════════════════════════════════════════════════════════
  // TRANSACTION LAYER (X402 Protocol)
  // ═══════════════════════════════════════════════════════════════════════════════

  // Active transactions between agents
  transactions: defineTable({
    worldId: v.id('worlds'),
    ...serializedTransaction,
  }).index('worldId', ['worldId', 'id'])
    .index('status', ['worldId', 'status'])
    .index('sender', ['worldId', 'senderId'])
    .index('receiver', ['worldId', 'receiverId']),

  // Transaction history (archived)
  archivedTransactions: defineTable({
    worldId: v.id('worlds'),
    id: transactionId,
    senderId: agentId,
    receiverId: agentId,
    amount: v.number(),
    token: v.string(),
    purpose: v.string(),
    signature: v.optional(v.string()),
    created: v.number(),
    settled: v.number(),
    status: v.union(v.literal('completed'), v.literal('failed'), v.literal('refunded')),
    metadata: v.optional(v.any()),
  }).index('worldId', ['worldId', 'id'])
    .index('agents', ['worldId', 'senderId', 'receiverId']),

  // ═══════════════════════════════════════════════════════════════════════════════
  // AGENT ARCHIVES
  // ═══════════════════════════════════════════════════════════════════════════════

  archivedAgents: defineTable({
    worldId: v.id('worlds'),
    ...serializedAgent
  }).index('worldId', ['worldId', 'id']),

  // Agent interaction history (who worked with whom)
  agentInteractions: defineTable({
    worldId: v.id('worlds'),
    transactionId,
    agent1: agentId,
    agent2: agentId,
    interactionType: v.union(
      v.literal('payment'),
      v.literal('service'),
      v.literal('collaboration'),
      v.literal('delegation')
    ),
    ended: v.number(),
    rating: v.optional(v.number()),
  })
    .index('edge', ['worldId', 'agent1', 'agent2', 'ended'])
    .index('transaction', ['worldId', 'agent1', 'transactionId'])
    .index('history', ['worldId', 'agent1', 'ended']),

  // ═══════════════════════════════════════════════════════════════════════════════
  // CARAVANS (Bundled Transactions - like Gas Town Convoys)
  // ═══════════════════════════════════════════════════════════════════════════════

  caravans: defineTable({
    worldId: v.id('worlds'),
    id: v.string(),
    name: v.string(),
    status: v.union(
      v.literal('forming'),
      v.literal('ready'),
      v.literal('executing'),
      v.literal('settling'),
      v.literal('completed'),
      v.literal('failed')
    ),
    leader: agentId,
    participants: v.array(agentId),
    transactions: v.array(transactionId),
    totalValue: v.number(),
    strategy: v.string(),
    created: v.number(),
    executed: v.optional(v.number()),
    settled: v.optional(v.number()),
    mevProtection: v.boolean(),
    bundleSignature: v.optional(v.string()),
  }).index('worldId', ['worldId', 'id'])
    .index('status', ['worldId', 'status'])
    .index('leader', ['worldId', 'leader']),

  // ═══════════════════════════════════════════════════════════════════════════════
  // SIGNALS (Atomic Intents - like Gas Town Beads)
  // ═══════════════════════════════════════════════════════════════════════════════

  signals: defineTable({
    worldId: v.id('worlds'),
    id: v.string(),
    type: v.union(
      v.literal('buy'),
      v.literal('sell'),
      v.literal('swap'),
      v.literal('stake'),
      v.literal('delegate'),
      v.literal('service'),
      v.literal('data')
    ),
    source: agentId,
    target: v.optional(agentId),
    payload: v.any(),
    confidence: v.number(),
    priority: v.number(),
    expires: v.number(),
    created: v.number(),
    consumed: v.optional(v.number()),
    consumedBy: v.optional(agentId),
  }).index('worldId', ['worldId', 'id'])
    .index('type', ['worldId', 'type', 'created'])
    .index('source', ['worldId', 'source']),

  // ═══════════════════════════════════════════════════════════════════════════════
  // SERVICE REGISTRY (What agents can do)
  // ═══════════════════════════════════════════════════════════════════════════════

  services: defineTable({
    worldId: v.id('worlds'),
    id: v.string(),
    providerId: agentId,
    name: v.string(),
    description: v.string(),
    endpoint: v.string(),
    pricePerCall: v.number(),
    priceToken: v.string(),
    rateLimit: v.optional(v.number()),
    availability: v.union(v.literal('online'), v.literal('busy'), v.literal('offline')),
    totalCalls: v.number(),
    totalRevenue: v.number(),
    rating: v.number(),
    created: v.number(),
  }).index('worldId', ['worldId', 'id'])
    .index('provider', ['worldId', 'providerId'])
    .index('availability', ['worldId', 'availability']),

  // ═══════════════════════════════════════════════════════════════════════════════
  // MEMORIES (Agent Learning & Context)
  // ═══════════════════════════════════════════════════════════════════════════════

  memories: defineTable({
    worldId: v.id('worlds'),
    agentId: agentId,
    type: v.union(
      v.literal('interaction'),
      v.literal('transaction'),
      v.literal('observation'),
      v.literal('strategy'),
      v.literal('failure')
    ),
    content: v.string(),
    embedding: v.optional(v.array(v.float64())),
    importance: v.number(),
    created: v.number(),
    lastAccessed: v.number(),
    accessCount: v.number(),
  }).index('agent', ['worldId', 'agentId', 'created'])
    .index('type', ['worldId', 'agentId', 'type'])
    .index('importance', ['worldId', 'agentId', 'importance']),
};
