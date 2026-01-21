/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * X402 WORLD - AI TOWN SIMULATION ENGINE
 * Autonomous agent behavior and world simulation
 * Drives the game loop for agent activities
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { v } from 'convex/values';
import { mutation, query, action, internalMutation, internalAction } from '../_generated/server';
import { Id } from '../_generated/dataModel';
import { api, internal } from '../_generated/api';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const TICK_INTERVAL = 5000; // 5 seconds per tick
const CONVERSATION_PROBABILITY = 0.15; // 15% chance to start conversation when idle
const ZONE_CHANGE_PROBABILITY = 0.05; // 5% chance to change zones when idle
const TRANSACTION_PROBABILITY = 0.10; // 10% chance to initiate transaction
const REFLECTION_INTERVAL = 300000; // Reflect every 5 minutes

// Zone adjacency map
const ZONE_CONNECTIONS: Record<string, string[]> = {
  nexus: ['exchange', 'archive', 'gateway', 'lab'],
  exchange: ['nexus', 'forge', 'vault'],
  forge: ['exchange', 'commons'],
  archive: ['nexus', 'lab'],
  gateway: ['nexus', 'commons'],
  vault: ['exchange', 'lab'],
  lab: ['nexus', 'archive', 'vault'],
  commons: ['forge', 'gateway'],
};

// ═══════════════════════════════════════════════════════════════════════════════
// SIMULATION QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

// Get world simulation status
export const getSimulationStatus = query({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, { worldId }) => {
    const worldStatus = await ctx.db
      .query('worldStatus')
      .withIndex('worldId', (q) => q.eq('worldId', worldId))
      .first();

    const world = await ctx.db.get(worldId);
    if (!world) return null;

    const activeConversations = await ctx.db
      .query('conversations')
      .withIndex('worldId', (q) => q.eq('worldId', worldId))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .collect();

    const agentsByState: Record<string, number> = {};
    const agentsByZone: Record<string, number> = {};

    for (const agent of world.agents) {
      agentsByState[agent.state] = (agentsByState[agent.state] || 0) + 1;
      agentsByZone[agent.zone] = (agentsByZone[agent.zone] || 0) + 1;
    }

    return {
      status: worldStatus?.status || 'unknown',
      totalAgents: world.agents.length,
      agentsByState,
      agentsByZone,
      activeConversations: activeConversations.length,
      lastTick: worldStatus?.lastViewed || 0,
    };
  },
});

// Get agent activity summary
export const getAgentActivity = query({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
  },
  handler: async (ctx, { worldId, agentId }) => {
    const world = await ctx.db.get(worldId);
    if (!world) return null;

    const agent = world.agents.find((a: any) => a.id === agentId);
    if (!agent) return null;

    const recentMemories = await ctx.db
      .query('memories')
      .withIndex('agentId', (q) => q.eq('agentId', agentId))
      .order('desc')
      .take(10);

    const currentPlan = await ctx.db
      .query('agentPlans')
      .withIndex('agentId', (q) => q.eq('agentId', agentId))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .first();

    return {
      agent,
      recentMemories: recentMemories.filter((m) => m.worldId === worldId),
      currentPlan,
    };
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT BEHAVIOR MUTATIONS
// ═══════════════════════════════════════════════════════════════════════════════

// Decide what an idle agent should do
export const decideAgentAction = mutation({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
  },
  handler: async (ctx, { worldId, agentId }) => {
    const world = await ctx.db.get(worldId);
    if (!world) return null;

    const agent = world.agents.find((a: any) => a.id === agentId);
    if (!agent || agent.state !== 'idle') return null;

    const random = Math.random();
    let action = 'idle';

    // Check for conversation opportunity
    if (random < CONVERSATION_PROBABILITY) {
      // Find potential conversation partner
      const potentialPartners = world.agents.filter((a: any) =>
        a.id !== agentId &&
        a.zone === agent.zone &&
        a.state === 'idle' &&
        !a.conversation
      );

      if (potentialPartners.length > 0) {
        const partner = potentialPartners[Math.floor(Math.random() * potentialPartners.length)];
        action = `start_conversation:${partner.id}`;
      }
    }
    // Check for zone change
    else if (random < CONVERSATION_PROBABILITY + ZONE_CHANGE_PROBABILITY) {
      const connections = ZONE_CONNECTIONS[agent.zone] || [];
      if (connections.length > 0) {
        const newZone = connections[Math.floor(Math.random() * connections.length)];
        action = `change_zone:${newZone}`;
      }
    }
    // Check for transaction
    else if (random < CONVERSATION_PROBABILITY + ZONE_CHANGE_PROBABILITY + TRANSACTION_PROBABILITY) {
      // Find potential transaction partner
      const potentialPartners = world.agents.filter((a: any) =>
        a.id !== agentId &&
        a.balance?.sol > 0
      );

      if (potentialPartners.length > 0) {
        const partner = potentialPartners[Math.floor(Math.random() * potentialPartners.length)];
        action = `transaction:${partner.id}`;
      }
    }

    return {
      agentId,
      action,
      timestamp: Date.now(),
    };
  },
});

// Execute an agent action
export const executeAgentAction = mutation({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
    action: v.string(),
  },
  handler: async (ctx, { worldId, agentId, action }) => {
    const world = await ctx.db.get(worldId);
    if (!world) return { success: false, error: 'World not found' };

    const agent = world.agents.find((a: any) => a.id === agentId);
    if (!agent) return { success: false, error: 'Agent not found' };

    const now = Date.now();
    const [actionType, targetId] = action.split(':');

    switch (actionType) {
      case 'start_conversation': {
        const target = world.agents.find((a: any) => a.id === targetId);
        if (!target) return { success: false, error: 'Target not found' };
        if (target.state !== 'idle') return { success: false, error: 'Target busy' };

        // Create conversation
        const conversationId = await ctx.db.insert('conversations', {
          worldId,
          participants: [agentId, targetId],
          topic: 'protocol optimization',
          zone: agent.zone,
          messages: [{
            agentId,
            content: `Hey ${target.name}, got a moment to discuss some X402 protocol matters?`,
            timestamp: now,
          }],
          startTime: now,
          status: 'active',
        });

        // Update both agents
        const updatedAgents = world.agents.map((a: any) => {
          if (a.id === agentId || a.id === targetId) {
            return { ...a, state: 'talking', conversation: conversationId, lastActive: now };
          }
          return a;
        });
        await ctx.db.patch(worldId, { agents: updatedAgents });

        return { success: true, action: 'started_conversation', conversationId };
      }

      case 'change_zone': {
        const newZone = targetId;
        const connections = ZONE_CONNECTIONS[agent.zone] || [];
        if (!connections.includes(newZone)) {
          return { success: false, error: 'Invalid zone transition' };
        }

        const updatedAgents = world.agents.map((a: any) => {
          if (a.id === agentId) {
            return { ...a, zone: newZone, state: 'walking', lastActive: now };
          }
          return a;
        });
        await ctx.db.patch(worldId, { agents: updatedAgents });

        // Add memory
        await ctx.db.insert('memories', {
          worldId,
          agentId,
          type: 'observation',
          content: `Moved from ${agent.zone} to ${newZone} zone.`,
          importance: 2,
          timestamp: now,
        });

        // Set back to idle after movement
        setTimeout(async () => {
          const currentWorld = await ctx.db.get(worldId);
          if (currentWorld) {
            const agents = currentWorld.agents.map((a: any) => {
              if (a.id === agentId && a.state === 'walking') {
                return { ...a, state: 'idle' };
              }
              return a;
            });
            await ctx.db.patch(worldId, { agents });
          }
        }, 3000);

        return { success: true, action: 'changed_zone', newZone };
      }

      case 'transaction': {
        const target = world.agents.find((a: any) => a.id === targetId);
        if (!target) return { success: false, error: 'Target not found' };

        // Simple transaction simulation
        const amount = Math.random() * 0.1; // Small random amount
        if (agent.balance?.sol < amount) {
          return { success: false, error: 'Insufficient balance' };
        }

        const updatedAgents = world.agents.map((a: any) => {
          if (a.id === agentId) {
            return {
              ...a,
              balance: { ...a.balance, sol: a.balance.sol - amount },
              totalTransactions: (a.totalTransactions || 0) + 1,
              lastActive: now,
            };
          }
          if (a.id === targetId) {
            return {
              ...a,
              balance: { ...a.balance, sol: (a.balance?.sol || 0) + amount },
              totalTransactions: (a.totalTransactions || 0) + 1,
            };
          }
          return a;
        });
        await ctx.db.patch(worldId, { agents: updatedAgents });

        // Add memory for both
        await ctx.db.insert('memories', {
          worldId,
          agentId,
          type: 'transaction',
          content: `Sent ${amount.toFixed(4)} SOL to ${target.name} via X402 protocol.`,
          importance: 5,
          timestamp: now,
        });

        await ctx.db.insert('memories', {
          worldId,
          agentId: targetId,
          type: 'transaction',
          content: `Received ${amount.toFixed(4)} SOL from ${agent.name} via X402 protocol.`,
          importance: 5,
          timestamp: now,
        });

        return { success: true, action: 'completed_transaction', amount };
      }

      default:
        return { success: false, error: 'Unknown action' };
    }
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// SIMULATION TICK
// ═══════════════════════════════════════════════════════════════════════════════

// Run one tick of the simulation
export const runSimulationTick = mutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, { worldId }) => {
    const world = await ctx.db.get(worldId);
    if (!world) return { error: 'World not found' };

    const now = Date.now();
    const results: any[] = [];

    // Process each agent
    for (const agent of world.agents) {
      // Handle agents in conversation
      if (agent.state === 'talking' && agent.conversation) {
        const conversation = await ctx.db.get(agent.conversation);
        if (conversation && conversation.status === 'active') {
          // 30% chance to continue conversation
          if (Math.random() < 0.3) {
            const lastMessage = conversation.messages[conversation.messages.length - 1];
            if (lastMessage.agentId !== agent.id) {
              // It's our turn to respond
              const responses = [
                'Good point. My analysis suggests similar patterns.',
                'Interesting. The X402 metrics align with that.',
                'Running recursive analysis... findings confirm.',
                'My RALPH depth on this is increasing.',
              ];
              const response = responses[Math.floor(Math.random() * responses.length)];

              await ctx.db.patch(agent.conversation, {
                messages: [...conversation.messages, {
                  agentId: agent.id,
                  content: response,
                  timestamp: now,
                }],
              });
              results.push({ agentId: agent.id, action: 'responded' });
            }
          }
          // Check if conversation should end
          if (conversation.messages.length > 5 && Math.random() < 0.4) {
            await ctx.db.patch(agent.conversation, { status: 'ended', endTime: now });
            const updatedAgents = world.agents.map((a: any) => {
              if (conversation.participants.includes(a.id)) {
                return { ...a, state: 'idle', conversation: null, lastActive: now };
              }
              return a;
            });
            await ctx.db.patch(worldId, { agents: updatedAgents });
            results.push({ agentId: agent.id, action: 'ended_conversation' });
          }
        }
      }
      // Handle idle agents
      else if (agent.state === 'idle') {
        const random = Math.random();

        // Small chance to do something
        if (random < 0.2) {
          // Find partners in same zone
          const zoneAgents = world.agents.filter((a: any) =>
            a.id !== agent.id &&
            a.zone === agent.zone &&
            a.state === 'idle'
          );

          if (zoneAgents.length > 0 && random < 0.1) {
            const partner = zoneAgents[Math.floor(Math.random() * zoneAgents.length)];
            results.push({
              agentId: agent.id,
              action: 'available_for_conversation',
              potentialPartner: partner.id,
            });
          }
        }
      }
      // Handle walking agents (transition back to idle)
      else if (agent.state === 'walking') {
        if (Math.random() < 0.5) {
          const updatedAgents = world.agents.map((a: any) => {
            if (a.id === agent.id) {
              return { ...a, state: 'idle', lastActive: now };
            }
            return a;
          });
          await ctx.db.patch(worldId, { agents: updatedAgents });
          results.push({ agentId: agent.id, action: 'arrived' });
        }
      }
    }

    // Update last tick time
    const worldStatus = await ctx.db
      .query('worldStatus')
      .withIndex('worldId', (q) => q.eq('worldId', worldId))
      .first();

    if (worldStatus) {
      await ctx.db.patch(worldStatus._id, { lastViewed: now });
    }

    return { tick: now, results };
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// SIMULATION CONTROL
// ═══════════════════════════════════════════════════════════════════════════════

// Start the simulation
export const startSimulation = mutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, { worldId }) => {
    const worldStatus = await ctx.db
      .query('worldStatus')
      .withIndex('worldId', (q) => q.eq('worldId', worldId))
      .first();

    if (worldStatus) {
      await ctx.db.patch(worldStatus._id, { status: 'running' });
    }

    return { success: true, status: 'running' };
  },
});

// Pause the simulation
export const pauseSimulation = mutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, { worldId }) => {
    const worldStatus = await ctx.db
      .query('worldStatus')
      .withIndex('worldId', (q) => q.eq('worldId', worldId))
      .first();

    if (worldStatus) {
      await ctx.db.patch(worldStatus._id, { status: 'paused' });
    }

    return { success: true, status: 'paused' };
  },
});
