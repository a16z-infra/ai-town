import { v } from 'convex/values';
import { internalMutation } from '../_generated/server';
import { Descriptions } from '../../data/characters';
import { internal } from '../_generated/api';
import { clearSubscriptions, scheduleAgentRun } from './scheduling';

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
    const agentId = await ctx.db.insert('agents', {
      worldId: args.worldId,
      playerId: args.playerId,
      identity: description.identity,
      plan: description.plan,
      generationNumber: 0,
      inProgressInputs: [],
      running: true,
    });
    await scheduleAgentRun(ctx, internal.agent.main.agentRun, agentId, Date.now(), 'init', true);
  },
});

export const kickAgents = internalMutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    const agents = await ctx.db
      .query('agents')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .collect();
    for (const agent of agents) {
      await scheduleAgentRun(
        ctx,
        internal.agent.main.agentRun,
        agent._id,
        Date.now(),
        'kick',
        true,
      );
    }
  },
});

export const stopAgents = internalMutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    const agents = await ctx.db
      .query('agents')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .collect();
    for (const agent of agents) {
      await clearSubscriptions(ctx.db, agent._id);
      await ctx.db.patch(agent._id, { running: false });
    }
  },
});

export const resumeAgents = internalMutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    const agents = await ctx.db
      .query('agents')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .collect();
    for (const agent of agents) {
      if (agent.running) {
        continue;
      }
      await ctx.db.patch(agent._id, { running: true });
      await scheduleAgentRun(
        ctx,
        internal.agent.main.agentRun,
        agent._id,
        Date.now(),
        'resume',
        true,
      );
    }
  },
});
