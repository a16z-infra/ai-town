import { v } from 'convex/values';
import { query, mutation } from '../_generated/server';
import { Id } from '../_generated/dataModel';

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC QUERIES FOR X402 WORLD
// Client-accessible queries for the RalphTown UI component
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get the default world ID
 */
export const getDefaultWorldId = query({
  handler: async (ctx) => {
    const worldStatus = await ctx.db
      .query('worldStatus')
      .filter((q) => q.eq(q.field('isDefault'), true))
      .first();
    return worldStatus?.worldId || null;
  },
});

/**
 * Get world state for visualization
 */
export const getWorldState = query({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, { worldId }) => {
    const world = await ctx.db.get(worldId);
    if (!world) {
      return null;
    }

    // Get agent descriptions
    const agentDescriptions = await ctx.db
      .query('agentDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', worldId))
      .collect();

    // Get conversations (if they exist in the schema)
    // For now, we'll return empty array as conversations are stored in world.agents
    const conversations: any[] = [];

    return {
      world: {
        agents: world.agents || [],
        transactions: world.transactions || [],
        signals: world.signals || [],
        caravans: world.caravans || [],
      },
      agentDescriptions: agentDescriptions.map((desc) => ({
        agentId: desc.agentId,
        name: desc.name,
        description: desc.description,
        avatar: desc.avatar,
        roleTitle: desc.roleTitle,
      })),
      conversations,
    };
  },
});

/**
 * Get simulation status
 */
export const getSimulationStatus = query({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, { worldId }) => {
    const worldStatus = await ctx.db
      .query('worldStatus')
      .withIndex('worldId', (q) => q.eq('worldId', worldId))
      .first();

    if (!worldStatus) {
      return { status: 'stopped' };
    }

    const engine = await ctx.db.get(worldStatus.engineId);
    return {
      status: engine?.running ? 'running' : 'stopped',
      lastStep: engine?.lastStepTs || null,
      currentTime: engine?.currentTime || null,
    };
  },
});

/**
 * Run a single simulation tick
 */
export const runSimulationTick = mutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, { worldId }) => {
    // This would trigger a simulation step
    // For now, we'll just return success
    // In production, this would call the game engine
    return { success: true, timestamp: Date.now() };
  },
});

/**
 * Start the simulation
 */
export const startSimulation = mutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, { worldId }) => {
    const worldStatus = await ctx.db
      .query('worldStatus')
      .withIndex('worldId', (q) => q.eq('worldId', worldId))
      .first();

    if (!worldStatus) {
      throw new Error('World not found');
    }

    const engine = await ctx.db.get(worldStatus.engineId);
    if (!engine) {
      throw new Error('Engine not found');
    }

    await ctx.db.patch(engine._id, { running: true });
    return { success: true };
  },
});

/**
 * Pause the simulation
 */
export const pauseSimulation = mutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, { worldId }) => {
    const worldStatus = await ctx.db
      .query('worldStatus')
      .withIndex('worldId', (q) => q.eq('worldId', worldId))
      .first();

    if (!worldStatus) {
      throw new Error('World not found');
    }

    const engine = await ctx.db.get(worldStatus.engineId);
    if (!engine) {
      throw new Error('Engine not found');
    }

    await ctx.db.patch(engine._id, { running: false });
    return { success: true };
  },
});
