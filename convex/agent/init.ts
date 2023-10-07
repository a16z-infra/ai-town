import { v } from 'convex/values';
import { internalMutation } from '../_generated/server';
import { Descriptions } from '../../data/characters';
import { internal } from '../_generated/api';
import { clearSubscriptions, wakeupAgent } from './scheduling';

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
      state: { kind: 'scheduled' },
    });
    await ctx.scheduler.runAfter(0, internal.agent.main.agentRun, {
      agentId,
      generationNumber: 0,
    });
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
      await wakeupAgent(ctx, agent._id, 'kick');
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
      await ctx.db.patch(agent._id, {
        generationNumber: agent.generationNumber + 1,
        state: { kind: 'stopped' },
      });
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
      if (agent.state.kind !== 'stopped') {
        continue;
      }
      const allowStopped = true;
      await wakeupAgent(ctx, agent._id, 'resume', allowStopped);
    }
  },
});
