import { v } from 'convex/values';
import { MutationCtx, internalMutation } from '../_generated/server';
import { Descriptions } from '../../data/characters';
import { internal } from '../_generated/api';
import { Id } from '../_generated/dataModel';

const SCHEDULER_INTERVAL = 5000;

export const initScheduler = internalMutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    const scheduler = await ctx.db
      .query('agentSchedulers')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .first();
    if (scheduler) {
      console.log(`Scheduler already exists for world ${args.worldId}`);
      return;
    }
    const schedulerId = await ctx.db.insert('agentSchedulers', {
      worldId: args.worldId,
      generationNumber: 0,
      running: true,
    });
    await ctx.scheduler.runAfter(0, internal.agent.main.batchedAgentLoop, {
      schedulerId,
      generationNumber: 0,
      maxDuration: SCHEDULER_INTERVAL,
    });
  },
});

export const initAgent = internalMutation({
  args: {
    worldId: v.id('worlds'),
    playerId: v.id('players'),
    character: v.string(),
  },
  handler: async (ctx, args) => {
    const existingAgent = await ctx.db
      .query('agents')
      .withIndex('playerId', (q) => q.eq('playerId', args.playerId))
      .first();
    if (existingAgent) {
      throw new Error(`Agent for player ${args.playerId} already exists`);
    }
    const description = Descriptions.find((d) => d.character === args.character);
    if (!description) {
      throw new Error(`No description found for character ${args.character}`);
    }
    await ctx.db.insert('agents', {
      worldId: args.worldId,
      playerId: args.playerId,
      identity: description.identity,
      plan: description.plan,
      inProgressInputs: [],
    });
  },
});

export const kickScheduler = internalMutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    const scheduler = await loadScheduler(ctx, args.worldId);
    if (!scheduler.running) {
      throw new Error(`Scheduler ${scheduler._id} not running`);
    }
    const generationNumber = scheduler.generationNumber + 1;
    await ctx.db.patch(scheduler._id, { generationNumber });
    await ctx.scheduler.runAfter(0, internal.agent.main.batchedAgentLoop, {
      schedulerId: scheduler._id,
      generationNumber,
      maxDuration: SCHEDULER_INTERVAL,
    });
  },
});

export const stopScheduler = internalMutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    const scheduler = await loadScheduler(ctx, args.worldId);
    if (!scheduler.running) {
      throw new Error(`Scheduler ${scheduler._id} not running`);
    }
    await ctx.db.patch(scheduler._id, { running: false });
  },
});

export const resumeScheduler = internalMutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    const scheduler = await loadScheduler(ctx, args.worldId);
    if (scheduler.running) {
      throw new Error(`Scheduler ${scheduler._id} already running`);
    }
    const generationNumber = scheduler.generationNumber + 1;
    await ctx.db.patch(scheduler._id, { running: true, generationNumber });
    await ctx.scheduler.runAfter(0, internal.agent.main.batchedAgentLoop, {
      schedulerId: scheduler._id,
      generationNumber,
      maxDuration: SCHEDULER_INTERVAL,
    });
  },
});

export async function loadScheduler(ctx: MutationCtx, worldId: Id<'worlds'>) {
  const scheduler = await ctx.db
    .query('agentSchedulers')
    .withIndex('worldId', (q) => q.eq('worldId', worldId))
    .first();
  if (!scheduler) {
    throw new Error(`Scheduler not found for world ${worldId}`);
  }
  return scheduler;
}
