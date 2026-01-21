import { v } from 'convex/values';
import { mutation, internalMutation } from '../_generated/server';
import { DEFAULT_X402_MAP } from './worldMap';
import { DEFAULT_AGENT_DESCRIPTIONS } from './agentDescription';
import { X402_CONFIG } from './x402Protocol';
import {
  MAX_AGENTS,
  STARTING_REPUTATION,
  ZONE_CONFIG,
} from '../constants';

// ═══════════════════════════════════════════════════════════════════════════════
// X402 WORLD INITIALIZATION
// Functions to create and setup a new X402 World instance
// ═══════════════════════════════════════════════════════════════════════════════

// Create a new X402 World
export const createWorld = mutation({
  args: {
    name: v.optional(v.string()),
    protocolVersion: v.optional(v.string()),
  },
  handler: async (ctx, { name, protocolVersion }) => {
    const now = Date.now();

    // Create the engine first (required for game engine)
    const engineId = await ctx.db.insert('engines', {
      currentTime: now,
      generationNumber: 0,
      running: true,
    });

    // Create the world document
    const worldId = await ctx.db.insert('worlds', {
      nextId: 1,
      conversations: [],
      players: [],
      agents: [],
      historicalLocations: undefined,
    });

    // Create world status with the correct engine ID
    await ctx.db.insert('worldStatus', {
      worldId,
      isDefault: true,
      engineId, // Use the actual engine ID
      lastViewed: now,
      status: 'running',
      protocolVersion: protocolVersion || `x402-v${X402_CONFIG.VERSION}`,
      networkStatus: 'connected',
      lastBlockHeight: 0,
    });

    // Create the map
    await ctx.db.insert('maps', {
      worldId,
      ...DEFAULT_X402_MAP,
    });

    // Initialize default agents
    await initializeDefaultAgents(ctx, worldId);

    return worldId;
  },
});

// Initialize the default agent lineup
async function initializeDefaultAgents(ctx: any, worldId: any) {
  const now = Date.now();
  const world = await ctx.db.get(worldId);
  if (!world) return;

  let nextId = world.nextId;
  const agents = [];

  // Create the core agents based on default descriptions
  for (const desc of DEFAULT_AGENT_DESCRIPTIONS) {
    const agentId = `ag:${String(nextId).padStart(6, '0')}`;
    nextId++;

    agents.push({
      id: agentId,
      name: desc.name,
      role: desc.roleTitle.toLowerCase().replace(' ', '_'),
      zone: getDefaultZoneForRole(desc.roleTitle),
      state: 'idle',
      balance: {
        sol: 10,
        usdc: 1000,
        x402: 100,
      },
      escrowBalance: 0,
      reputation: desc.roleTitle === 'Chief Orchestrator' ? 100 : STARTING_REPUTATION + 20,
      capabilities: getCapabilitiesForRole(desc.roleTitle),
      pricePerRequest: getPriceForRole(desc.roleTitle),
      serviceEndpoint: `https://x402.world/agents/${agentId}`,
      recursionDepth: 0,
      maxRecursionDepth: 7,
      confidence: 50,
      totalTransactions: 0,
      created: now,
      lastActive: now,
    });

    // Create agent description
    await ctx.db.insert('agentDescriptions', {
      worldId,
      agentId,
      ...desc,
    });
  }

  // Update world with agents
  await ctx.db.patch(worldId, {
    nextId,
    agents,
  });
}

function getDefaultZoneForRole(roleTitle: string): string {
  const zoneMap: Record<string, string> = {
    'Chief Orchestrator': 'nexus',
    'Liquidity Coordinator': 'exchange',
    'Signal Processor': 'archive',
    'Deep Analysis Engine': 'lab',
    'Gateway Guardian': 'gateway',
    'General Purpose': 'commons',
  };
  return zoneMap[roleTitle] || 'commons';
}

function getCapabilitiesForRole(roleTitle: string): string[] {
  const capabilityMap: Record<string, string[]> = {
    'Chief Orchestrator': ['coordination', 'strategy', 'governance', 'oracle', 'search', 'web_search', 'x_search', 'structured_output', 'vision', 'image_analysis', 'voice', 'voice_response'],
    'Liquidity Coordinator': ['trading', 'swaps', 'liquidity', 'mixing', 'search', 'structured_output', 'voice'],
    'Signal Processor': ['monitoring', 'signals', 'alerts', 'watching', 'x_search', 'web_search', 'structured_output', 'vision', 'voice'],
    'Deep Analysis Engine': ['analysis', 'recursion', 'optimization', 'ralph', 'search', 'web_search', 'structured_output', 'vision', 'image_analysis', 'voice'],
    'Gateway Guardian': ['security', 'verification', 'access', 'sentinel', 'vision', 'voice'],
    'General Purpose': ['basic', 'execution', 'delivery', 'search', 'structured_output', 'voice'],
  };
  return capabilityMap[roleTitle] || ['basic'];
}

function getPriceForRole(roleTitle: string): number {
  const priceMap: Record<string, number> = {
    'Chief Orchestrator': 0.1,
    'Liquidity Coordinator': 0.05,
    'Signal Processor': 0.02,
    'Deep Analysis Engine': 0.08,
    'Gateway Guardian': 0.03,
    'General Purpose': 0.01,
  };
  return priceMap[roleTitle] || 0.01;
}

// Reset a world to initial state
export const resetWorld = mutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, { worldId }) => {
    const world = await ctx.db.get(worldId);
    if (!world) return;

    // Clear all agents and transactions
    await ctx.db.patch(worldId, {
      nextId: 1,
      agents: [],
      conversations: [],
      players: [],
    });

    // Delete all agent descriptions for this world
    const descriptions = await ctx.db
      .query('agentDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', worldId))
      .collect();

    for (const desc of descriptions) {
      await ctx.db.delete(desc._id);
    }

    // Reinitialize default agents
    await initializeDefaultAgents(ctx, worldId);
  },
});

// Spawn a new agent in the world
export const spawnAgent = mutation({
  args: {
    worldId: v.id('worlds'),
    name: v.string(),
    role: v.string(),
    zone: v.optional(v.string()),
    personality: v.optional(v.string()),
    capabilities: v.optional(v.array(v.string())),
    isHuman: v.optional(v.boolean()),
  },
  handler: async (ctx, { worldId, name, role, zone, personality, capabilities, isHuman }) => {
    const world = await ctx.db.get(worldId);
    if (!world) throw new Error('World not found');

    // Check agent limit
    if (world.agents.length >= MAX_AGENTS) {
      throw new Error('Maximum agent limit reached');
    }

    const now = Date.now();
    const agentId = `ag:${String(world.nextId).padStart(6, '0')}`;

    const newAgent = {
      id: agentId,
      name,
      role,
      zone: zone || 'commons',
      state: 'idle',
      balance: {
        sol: 1,
        usdc: 100,
        x402: 10,
      },
      escrowBalance: 0,
      reputation: STARTING_REPUTATION,
      capabilities: capabilities || getCapabilitiesForRole(role),
      pricePerRequest: 0.01,
      serviceEndpoint: `https://x402.world/agents/${agentId}`,
      recursionDepth: 0,
      maxRecursionDepth: 7,
      confidence: 50,
      totalTransactions: 0,
      created: now,
      lastActive: now,
      isHuman: isHuman || false,
    };

    // Add agent description
    await ctx.db.insert('agentDescriptions', {
      worldId,
      agentId,
      name,
      avatar: getAvatarForRole(role),
      personality: personality || `A ${role} agent in X402 World.`,
      greetings: [`Hello, I'm ${name}.`],
      backstory: `Created in X402 World at ${new Date(now).toISOString()}.`,
      roleTitle: role,
    });

    // Update world
    await ctx.db.patch(worldId, {
      nextId: world.nextId + 1,
      agents: [...world.agents, newAgent],
    });

    return agentId;
  },
});

function getAvatarForRole(role: string): string {
  const avatarMap: Record<string, string> = {
    oracle: '🔮',
    mixer: '🔀',
    watcher: '👁️',
    recursion: '🌀',
    node: '⬡',
    sentinel: '🛡️',
    diamond: '💎',
    specialist: '🎯',
  };
  return avatarMap[role] || '⬡';
}

// Fund an agent with tokens
export const fundAgent = mutation({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
    amount: v.number(),
    tokenType: v.union(v.literal('sol'), v.literal('usdc'), v.literal('x402')),
  },
  handler: async (ctx, { worldId, agentId, amount, tokenType }) => {
    const world = await ctx.db.get(worldId);
    if (!world) throw new Error('World not found');

    const updatedAgents = world.agents.map((agent: any) => {
      if (agent.id === agentId) {
        return {
          ...agent,
          balance: {
            ...agent.balance,
            [tokenType]: (agent.balance?.[tokenType] || 0) + amount,
          },
        };
      }
      return agent;
    });

    await ctx.db.patch(worldId, { agents: updatedAgents });
  },
});

// Get world configuration
export const getWorldConfig = mutation({
  args: {},
  handler: async () => {
    return {
      x402Protocol: X402_CONFIG,
      zones: ZONE_CONFIG,
      maxAgents: MAX_AGENTS,
      startingReputation: STARTING_REPUTATION,
      defaultMap: DEFAULT_X402_MAP,
    };
  },
});
