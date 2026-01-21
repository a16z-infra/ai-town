/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * X402 WORLD - AI TOWN AGENT SYSTEM
 * Generative agents with memory, conversations, and autonomous behavior
 * Based on a16z-infra AI Town architecture
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { v } from 'convex/values';
import { mutation, query, action, internalMutation, internalQuery } from '../_generated/server';
import { Id } from '../_generated/dataModel';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface AgentState {
  id: string;
  name: string;
  role: string;
  zone: string;
  position: { x: number; y: number };
  facing: 'up' | 'down' | 'left' | 'right';
  status: 'idle' | 'walking' | 'talking' | 'working' | 'thinking';
  currentAction: string | null;
  conversation: string | null;
  lastActive: number;
}

export interface Memory {
  id: string;
  agentId: string;
  type: 'observation' | 'reflection' | 'plan' | 'conversation';
  content: string;
  importance: number;
  embedding?: number[];
  timestamp: number;
  relatedMemories?: string[];
}

export interface Conversation {
  id: string;
  participants: string[];
  messages: ConversationMessage[];
  topic: string;
  zone: string;
  startTime: number;
  endTime?: number;
  status: 'active' | 'ended';
}

export interface ConversationMessage {
  agentId: string;
  content: string;
  timestamp: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

// Get all agents in the world
export const getAgents = query({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, { worldId }) => {
    const world = await ctx.db.get(worldId);
    if (!world) return [];
    return world.agents || [];
  },
});

// Get a specific agent by ID
export const getAgent = query({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
  },
  handler: async (ctx, { worldId, agentId }) => {
    const world = await ctx.db.get(worldId);
    if (!world) return null;
    return world.agents?.find((a: any) => a.id === agentId) || null;
  },
});

// Get agents in a specific zone
export const getAgentsByZone = query({
  args: {
    worldId: v.id('worlds'),
    zone: v.string(),
  },
  handler: async (ctx, { worldId, zone }) => {
    const world = await ctx.db.get(worldId);
    if (!world) return [];
    return (world.agents || []).filter((a: any) => a.zone === zone);
  },
});

// Get agent description
export const getAgentDescription = query({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
  },
  handler: async (ctx, { worldId, agentId }) => {
    return await ctx.db
      .query('agentDescriptions')
      .withIndex('agentId', (q) => q.eq('agentId', agentId))
      .first();
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT MUTATIONS
// ═══════════════════════════════════════════════════════════════════════════════

// Update agent position
export const moveAgent = mutation({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
    position: v.object({
      x: v.number(),
      y: v.number(),
    }),
    facing: v.optional(v.union(
      v.literal('up'),
      v.literal('down'),
      v.literal('left'),
      v.literal('right')
    )),
  },
  handler: async (ctx, { worldId, agentId, position, facing }) => {
    const world = await ctx.db.get(worldId);
    if (!world) throw new Error('World not found');

    const updatedAgents = world.agents.map((agent: any) => {
      if (agent.id === agentId) {
        return {
          ...agent,
          position,
          facing: facing || agent.facing,
          state: 'walking',
          lastActive: Date.now(),
        };
      }
      return agent;
    });

    await ctx.db.patch(worldId, { agents: updatedAgents });
  },
});

// Update agent status
export const setAgentStatus = mutation({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
    status: v.union(
      v.literal('idle'),
      v.literal('walking'),
      v.literal('talking'),
      v.literal('working'),
      v.literal('thinking')
    ),
    currentAction: v.optional(v.string()),
  },
  handler: async (ctx, { worldId, agentId, status, currentAction }) => {
    const world = await ctx.db.get(worldId);
    if (!world) throw new Error('World not found');

    const updatedAgents = world.agents.map((agent: any) => {
      if (agent.id === agentId) {
        return {
          ...agent,
          state: status,
          currentAction: currentAction || null,
          lastActive: Date.now(),
        };
      }
      return agent;
    });

    await ctx.db.patch(worldId, { agents: updatedAgents });
  },
});

// Change agent zone
export const changeAgentZone = mutation({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
    zone: v.string(),
    position: v.optional(v.object({
      x: v.number(),
      y: v.number(),
    })),
  },
  handler: async (ctx, { worldId, agentId, zone, position }) => {
    const world = await ctx.db.get(worldId);
    if (!world) throw new Error('World not found');

    // Get zone spawn point if position not provided
    const map = await ctx.db
      .query('maps')
      .withIndex('worldId', (q) => q.eq('worldId', worldId))
      .first();

    const zoneData = map?.zones?.find((z: any) => z.id === zone);
    const spawnPoint = position || zoneData?.position || { x: 0, y: 0 };

    const updatedAgents = world.agents.map((agent: any) => {
      if (agent.id === agentId) {
        return {
          ...agent,
          zone,
          position: spawnPoint,
          lastActive: Date.now(),
        };
      }
      return agent;
    });

    await ctx.db.patch(worldId, { agents: updatedAgents });

    // Create memory of zone change
    await ctx.db.insert('memories', {
      worldId,
      agentId,
      type: 'observation',
      content: `Moved to ${zone} zone.`,
      importance: 3,
      timestamp: Date.now(),
    });
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// MEMORY SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

// Add a memory to an agent
export const addMemory = mutation({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
    type: v.union(
      v.literal('observation'),
      v.literal('reflection'),
      v.literal('plan'),
      v.literal('conversation')
    ),
    content: v.string(),
    importance: v.number(),
    relatedMemories: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { worldId, agentId, type, content, importance, relatedMemories }) => {
    return await ctx.db.insert('memories', {
      worldId,
      agentId,
      type,
      content,
      importance,
      relatedMemories,
      timestamp: Date.now(),
    });
  },
});

// Get recent memories for an agent
export const getRecentMemories = query({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
    limit: v.optional(v.number()),
    type: v.optional(v.union(
      v.literal('observation'),
      v.literal('reflection'),
      v.literal('plan'),
      v.literal('conversation')
    )),
  },
  handler: async (ctx, { worldId, agentId, limit, type }) => {
    let query = ctx.db
      .query('memories')
      .withIndex('agentId', (q) => q.eq('agentId', agentId))
      .order('desc');

    const memories = await query.collect();

    let filtered = memories.filter((m) => m.worldId === worldId);
    if (type) {
      filtered = filtered.filter((m) => m.type === type);
    }

    return filtered.slice(0, limit || 50);
  },
});

// Get important memories (for reflection)
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
      .filter((m) => m.worldId === worldId && m.importance >= (minImportance || 5))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit || 20);
  },
});

// Create a reflection based on recent memories
export const createReflection = mutation({
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
      importance: 8, // Reflections are high importance
      relatedMemories: relatedMemoryIds,
      timestamp: Date.now(),
    });
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// CONVERSATION SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

// Start a conversation between agents
export const startConversation = mutation({
  args: {
    worldId: v.id('worlds'),
    participants: v.array(v.string()),
    topic: v.string(),
    zone: v.string(),
    initialMessage: v.optional(v.object({
      agentId: v.string(),
      content: v.string(),
    })),
  },
  handler: async (ctx, { worldId, participants, topic, zone, initialMessage }) => {
    const now = Date.now();

    const conversationId = await ctx.db.insert('conversations', {
      worldId,
      participants,
      topic,
      zone,
      messages: initialMessage ? [{
        agentId: initialMessage.agentId,
        content: initialMessage.content,
        timestamp: now,
      }] : [],
      startTime: now,
      status: 'active',
    });

    // Update agents' status to talking
    const world = await ctx.db.get(worldId);
    if (world) {
      const updatedAgents = world.agents.map((agent: any) => {
        if (participants.includes(agent.id)) {
          return {
            ...agent,
            state: 'talking',
            conversation: conversationId,
            lastActive: now,
          };
        }
        return agent;
      });
      await ctx.db.patch(worldId, { agents: updatedAgents });
    }

    return conversationId;
  },
});

// Add message to conversation
export const addConversationMessage = mutation({
  args: {
    conversationId: v.id('conversations'),
    agentId: v.string(),
    content: v.string(),
    sentiment: v.optional(v.union(
      v.literal('positive'),
      v.literal('neutral'),
      v.literal('negative')
    )),
  },
  handler: async (ctx, { conversationId, agentId, content, sentiment }) => {
    const conversation = await ctx.db.get(conversationId);
    if (!conversation) throw new Error('Conversation not found');
    if (conversation.status !== 'active') throw new Error('Conversation has ended');

    const newMessage = {
      agentId,
      content,
      timestamp: Date.now(),
      sentiment: sentiment || 'neutral',
    };

    await ctx.db.patch(conversationId, {
      messages: [...conversation.messages, newMessage],
    });

    // Create memory of this message for all participants
    for (const participantId of conversation.participants) {
      if (participantId !== agentId) {
        await ctx.db.insert('memories', {
          worldId: conversation.worldId,
          agentId: participantId,
          type: 'conversation',
          content: `${agentId} said: "${content}"`,
          importance: 4,
          timestamp: Date.now(),
        });
      }
    }

    return newMessage;
  },
});

// End conversation
export const endConversation = mutation({
  args: {
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, { conversationId }) => {
    const conversation = await ctx.db.get(conversationId);
    if (!conversation) throw new Error('Conversation not found');

    await ctx.db.patch(conversationId, {
      status: 'ended',
      endTime: Date.now(),
    });

    // Update agents' status back to idle
    const world = await ctx.db.get(conversation.worldId);
    if (world) {
      const updatedAgents = world.agents.map((agent: any) => {
        if (conversation.participants.includes(agent.id)) {
          return {
            ...agent,
            state: 'idle',
            conversation: null,
            lastActive: Date.now(),
          };
        }
        return agent;
      });
      await ctx.db.patch(conversation.worldId, { agents: updatedAgents });
    }

    // Create memory of conversation ending
    const summary = `Had a conversation about ${conversation.topic} with ${conversation.participants.length - 1} others.`;
    for (const participantId of conversation.participants) {
      await ctx.db.insert('memories', {
        worldId: conversation.worldId,
        agentId: participantId,
        type: 'conversation',
        content: summary,
        importance: 5,
        timestamp: Date.now(),
      });
    }
  },
});

// Get active conversations in a zone
export const getActiveConversations = query({
  args: {
    worldId: v.id('worlds'),
    zone: v.optional(v.string()),
  },
  handler: async (ctx, { worldId, zone }) => {
    let conversations = await ctx.db
      .query('conversations')
      .withIndex('worldId', (q) => q.eq('worldId', worldId))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .collect();

    if (zone) {
      conversations = conversations.filter((c) => c.zone === zone);
    }

    return conversations;
  },
});

// Get conversation by ID
export const getConversation = query({
  args: {
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, { conversationId }) => {
    return await ctx.db.get(conversationId);
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT BEHAVIOR / PLANNING
// ═══════════════════════════════════════════════════════════════════════════════

// Create a plan for an agent
export const createPlan = mutation({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
    plan: v.array(v.object({
      action: v.string(),
      target: v.optional(v.string()),
      duration: v.number(),
      priority: v.number(),
    })),
  },
  handler: async (ctx, { worldId, agentId, plan }) => {
    // Store as a plan memory
    const planContent = plan.map((p) => `${p.action}${p.target ? ` (${p.target})` : ''}`).join(' → ');

    await ctx.db.insert('memories', {
      worldId,
      agentId,
      type: 'plan',
      content: `Plan: ${planContent}`,
      importance: 6,
      timestamp: Date.now(),
    });

    // Store the actual plan
    return await ctx.db.insert('agentPlans', {
      worldId,
      agentId,
      plan,
      currentStep: 0,
      status: 'active',
      createdAt: Date.now(),
    });
  },
});

// Get current plan for agent
export const getCurrentPlan = query({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
  },
  handler: async (ctx, { worldId, agentId }) => {
    return await ctx.db
      .query('agentPlans')
      .withIndex('agentId', (q) => q.eq('agentId', agentId))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .first();
  },
});

// Advance plan to next step
export const advancePlan = mutation({
  args: {
    planId: v.id('agentPlans'),
  },
  handler: async (ctx, { planId }) => {
    const plan = await ctx.db.get(planId);
    if (!plan) throw new Error('Plan not found');

    const nextStep = plan.currentStep + 1;
    if (nextStep >= plan.plan.length) {
      await ctx.db.patch(planId, { status: 'completed' });
      return null;
    }

    await ctx.db.patch(planId, { currentStep: nextStep });
    return plan.plan[nextStep];
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// PATHFINDING
// ═══════════════════════════════════════════════════════════════════════════════

// Calculate path between two points (A* simplified)
export const calculatePath = query({
  args: {
    worldId: v.id('worlds'),
    start: v.object({ x: v.number(), y: v.number() }),
    end: v.object({ x: v.number(), y: v.number() }),
  },
  handler: async (ctx, { worldId, start, end }) => {
    // Simple direct path for now
    // In full implementation, this would use A* with obstacle avoidance
    const path = [];
    const steps = 10;

    for (let i = 0; i <= steps; i++) {
      path.push({
        x: start.x + (end.x - start.x) * (i / steps),
        y: start.y + (end.y - start.y) * (i / steps),
      });
    }

    return path;
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// WORLD STATE
// ═══════════════════════════════════════════════════════════════════════════════

// Get full world state for rendering
export const getWorldState = query({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, { worldId }) => {
    const world = await ctx.db.get(worldId);
    if (!world) return null;

    const map = await ctx.db
      .query('maps')
      .withIndex('worldId', (q) => q.eq('worldId', worldId))
      .first();

    const conversations = await ctx.db
      .query('conversations')
      .withIndex('worldId', (q) => q.eq('worldId', worldId))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .collect();

    const descriptions = await ctx.db
      .query('agentDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', worldId))
      .collect();

    return {
      world,
      map,
      conversations,
      descriptions,
      timestamp: Date.now(),
    };
  },
});
