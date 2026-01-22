/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * X402 WORLD - AI TOWN MEMORY SYSTEM
 * Generative agents memory architecture with observations, reflections, and plans
 * Based on "Generative Agents: Interactive Simulacra of Human Behavior"
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { v } from 'convex/values';
import { mutation, query, action, internalMutation } from '../_generated/server';
import { Id } from '../_generated/dataModel';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type MemoryType = 'observation' | 'reflection' | 'plan' | 'conversation' | 'transaction';

export interface MemoryEntry {
  id: string;
  agentId: string;
  type: MemoryType;
  content: string;
  importance: number;
  timestamp: number;
  embedding?: number[];
  relatedMemories?: string[];
  metadata?: Record<string, any>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// IMPORTANCE SCORING
// ═══════════════════════════════════════════════════════════════════════════════

const IMPORTANCE_WEIGHTS: Record<string, number> = {
  // Base importance by type
  'observation': 2,
  'reflection': 8,
  'plan': 6,
  'conversation': 4,
  'transaction': 7,

  // Keyword boosts
  'success': 2,
  'failure': 3,
  'critical': 4,
  'urgent': 3,
  'protocol': 2,
  'breach': 5,
  'profit': 2,
  'loss': 3,
  'RALPH': 3,
  'recursive': 2,
  'x402': 2,
};

function calculateImportance(type: MemoryType, content: string): number {
  let importance = IMPORTANCE_WEIGHTS[type] || 3;

  // Check for keyword boosts
  const lowerContent = content.toLowerCase();
  for (const [keyword, boost] of Object.entries(IMPORTANCE_WEIGHTS)) {
    if (lowerContent.includes(keyword)) {
      importance += boost;
    }
  }

  // Cap importance at 10
  return Math.min(10, importance);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEMORY QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

// Get recent memories (with recency weighting)
export const getRecentMemories = query({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
    limit: v.optional(v.number()),
    type: v.optional(v.string()),
    hoursBack: v.optional(v.number()),
  },
  handler: async (ctx, { worldId, agentId, limit, type, hoursBack }) => {
    const cutoffTime = hoursBack
      ? Date.now() - hoursBack * 60 * 60 * 1000
      : 0;

    let memories = await ctx.db
      .query('memories')
      .withIndex('agentId', (q) => q.eq('agentId', agentId))
      .order('desc')
      .collect();

    memories = memories.filter((m) =>
      m.worldId === worldId &&
      m.timestamp >= cutoffTime
    );

    if (type) {
      memories = memories.filter((m) => m.type === type);
    }

    // Calculate retrieval score (recency * importance)
    const now = Date.now();
    const scoredMemories = memories.map((m) => {
      const hoursSince = (now - m.timestamp) / (1000 * 60 * 60);
      const recencyScore = Math.exp(-hoursSince / 24); // Decay over 24 hours
      const retrievalScore = recencyScore * (m.importance / 10);
      return { ...m, retrievalScore };
    });

    // Sort by retrieval score
    scoredMemories.sort((a, b) => b.retrievalScore - a.retrievalScore);

    return scoredMemories.slice(0, limit || 50);
  },
});

// Get important memories for reflection
export const getImportantMemories = query({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
    minImportance: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { worldId, agentId, minImportance, limit }) => {
    const memories = await ctx.db
      .query('memories')
      .withIndex('agentId', (q) => q.eq('agentId', agentId))
      .collect();

    return memories
      .filter((m) =>
        m.worldId === worldId &&
        m.importance >= (minImportance || 6)
      )
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit || 20);
  },
});

// Get memories by type
export const getMemoriesByType = query({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
    type: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { worldId, agentId, type, limit }) => {
    const memories = await ctx.db
      .query('memories')
      .withIndex('agentId', (q) => q.eq('agentId', agentId))
      .order('desc')
      .collect();

    return memories
      .filter((m) => m.worldId === worldId && m.type === type)
      .slice(0, limit || 30);
  },
});

// Search memories by content
export const searchMemories = query({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { worldId, agentId, query: searchQuery, limit }) => {
    const memories = await ctx.db
      .query('memories')
      .withIndex('agentId', (q) => q.eq('agentId', agentId))
      .collect();

    const queryLower = searchQuery.toLowerCase();
    const results = memories.filter((m) =>
      m.worldId === worldId &&
      m.content.toLowerCase().includes(queryLower)
    );

    return results
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit || 20);
  },
});

// Get memory summary for an agent
export const getMemorySummary = query({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
  },
  handler: async (ctx, { worldId, agentId }) => {
    const memories = await ctx.db
      .query('memories')
      .withIndex('agentId', (q) => q.eq('agentId', agentId))
      .collect();

    const worldMemories = memories.filter((m) => m.worldId === worldId);

    const byType: Record<string, number> = {};
    let totalImportance = 0;

    for (const m of worldMemories) {
      byType[m.type] = (byType[m.type] || 0) + 1;
      totalImportance += m.importance;
    }

    return {
      totalMemories: worldMemories.length,
      byType,
      averageImportance: worldMemories.length > 0
        ? totalImportance / worldMemories.length
        : 0,
      oldestMemory: worldMemories.length > 0
        ? Math.min(...worldMemories.map((m) => m.timestamp))
        : null,
      newestMemory: worldMemories.length > 0
        ? Math.max(...worldMemories.map((m) => m.timestamp))
        : null,
    };
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// MEMORY MUTATIONS
// ═══════════════════════════════════════════════════════════════════════════════

// Add an observation memory
export const addObservation = mutation({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
    content: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, { worldId, agentId, content, metadata }) => {
    const importance = calculateImportance('observation', content);

    return await ctx.db.insert('memories', {
      worldId,
      agentId,
      type: 'observation',
      content,
      importance,
      timestamp: Date.now(),
      metadata,
    });
  },
});

// Add a reflection memory (synthesized from other memories)
export const addReflection = mutation({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
    content: v.string(),
    relatedMemoryIds: v.array(v.string()),
  },
  handler: async (ctx, { worldId, agentId, content, relatedMemoryIds }) => {
    return await ctx.db.insert('memories', {
      worldId,
      agentId,
      type: 'reflection',
      content,
      importance: 8, // Reflections are always high importance
      relatedMemories: relatedMemoryIds,
      timestamp: Date.now(),
    });
  },
});

// Add a plan memory
export const addPlan = mutation({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
    content: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, { worldId, agentId, content, metadata }) => {
    return await ctx.db.insert('memories', {
      worldId,
      agentId,
      type: 'plan',
      content,
      importance: 6,
      timestamp: Date.now(),
      metadata,
    });
  },
});

// Add a transaction memory
export const addTransactionMemory = mutation({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
    transactionType: v.string(),
    amount: v.number(),
    counterparty: v.optional(v.string()),
    success: v.boolean(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, { worldId, agentId, transactionType, amount, counterparty, success, details }) => {
    const statusWord = success ? 'Completed' : 'Failed';
    const content = counterparty
      ? `${statusWord} ${transactionType} of ${amount} with ${counterparty}. ${details || ''}`
      : `${statusWord} ${transactionType} of ${amount}. ${details || ''}`;

    const importance = calculateImportance('transaction', content);

    return await ctx.db.insert('memories', {
      worldId,
      agentId,
      type: 'transaction',
      content,
      importance,
      timestamp: Date.now(),
      metadata: {
        transactionType,
        amount,
        counterparty,
        success,
      },
    });
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// REFLECTION GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

// Generate a reflection from recent memories
export const generateReflection = mutation({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
  },
  handler: async (ctx, { worldId, agentId }) => {
    // Get recent high-importance memories
    const memories = await ctx.db
      .query('memories')
      .withIndex('agentId', (q) => q.eq('agentId', agentId))
      .order('desc')
      .collect();

    const recentImportant = memories
      .filter((m) => m.worldId === worldId && m.importance >= 5)
      .slice(0, 10);

    if (recentImportant.length < 3) {
      return null; // Not enough memories to reflect on
    }

    // Generate reflection based on memory patterns
    const types = recentImportant.map((m) => m.type);
    const hasTransactions = types.includes('transaction');
    const hasConversations = types.includes('conversation');

    let reflection = '';
    if (hasTransactions && hasConversations) {
      reflection = 'Recent interactions and transactions suggest emerging patterns in network behavior. Key insight: social and economic activities are correlated.';
    } else if (hasTransactions) {
      reflection = 'Analysis of recent transactions reveals optimization opportunities. The X402 protocol efficiency can be improved.';
    } else if (hasConversations) {
      reflection = 'Recent conversations have expanded my understanding of other agents\' perspectives. Collaboration opportunities identified.';
    } else {
      reflection = 'Observations from this period indicate stable system operation. Continuing to monitor for anomalies.';
    }

    return await ctx.db.insert('memories', {
      worldId,
      agentId,
      type: 'reflection',
      content: reflection,
      importance: 8,
      relatedMemories: recentImportant.map((m) => m._id.toString()),
      timestamp: Date.now(),
    });
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// MEMORY MAINTENANCE
// ═══════════════════════════════════════════════════════════════════════════════

// Consolidate old memories (decay low-importance memories)
export const consolidateMemories = mutation({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
    maxMemories: v.optional(v.number()),
  },
  handler: async (ctx, { worldId, agentId, maxMemories }) => {
    const limit = maxMemories || 500;

    const memories = await ctx.db
      .query('memories')
      .withIndex('agentId', (q) => q.eq('agentId', agentId))
      .order('desc')
      .collect();

    const worldMemories = memories.filter((m) => m.worldId === worldId);

    if (worldMemories.length <= limit) {
      return { consolidated: 0 };
    }

    // Sort by importance * recency
    const now = Date.now();
    const scored = worldMemories.map((m) => {
      const hoursSince = (now - m.timestamp) / (1000 * 60 * 60);
      const recencyScore = Math.exp(-hoursSince / 168); // Week decay
      return { memory: m, score: recencyScore * m.importance };
    });

    scored.sort((a, b) => b.score - a.score);

    // Delete lowest scored memories beyond limit
    const toDelete = scored.slice(limit).map((s) => s.memory._id);
    for (const id of toDelete) {
      await ctx.db.delete(id);
    }

    return { consolidated: toDelete.length };
  },
});

// Clear all memories for an agent (for testing/reset)
export const clearAgentMemories = mutation({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
  },
  handler: async (ctx, { worldId, agentId }) => {
    const memories = await ctx.db
      .query('memories')
      .withIndex('agentId', (q) => q.eq('agentId', agentId))
      .collect();

    const toDelete = memories.filter((m) => m.worldId === worldId);
    for (const m of toDelete) {
      await ctx.db.delete(m._id);
    }

    return { deleted: toDelete.length };
  },
});
