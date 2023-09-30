import { v } from 'convex/values';
import { internalMutation } from '../_generated/server';
import { Descriptions } from '../data/characters';
import { internal } from '../_generated/api';

export const initAgent = internalMutation({
  args: {
    engineId: v.id('engines'),
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
      engineId: args.engineId,
      playerId: args.playerId,
      identity: description.identity,
      plan: description.plan,
      generationNumber: 0,
    });
    await ctx.scheduler.runAfter(0, internal.agent.main.agentRun, {
      agentId,
      generationNumber: 0,
    });
  },
});

export const restartAgents = internalMutation({
  args: {
    engineId: v.id('engines'),
  },
  handler: async (ctx, args) => {
    const agents = await ctx.db
      .query('agents')
      .withIndex('engineId', (q) => q.eq('engineId', args.engineId))
      .collect();
    for (const agent of agents) {
      const generationNumber = agent.generationNumber + 1;
      await ctx.db.patch(agent._id, { generationNumber });
      await ctx.scheduler.runAfter(0, internal.agent.main.agentRun, {
        agentId: agent._id,
        generationNumber,
      });
    }
  },
});

export const stopAgents = internalMutation({
  args: {
    engineId: v.id('engines'),
  },
  handler: async (ctx, args) => {
    const agents = await ctx.db
      .query('agents')
      .withIndex('engineId', (q) => q.eq('engineId', args.engineId))
      .collect();
    for (const agent of agents) {
      await ctx.db.patch(agent._id, { generationNumber: agent.generationNumber + 1 });
    }
  },
});
