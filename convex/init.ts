import { v } from 'convex/values';
import { api, internal } from './_generated/api';
import { internalMutation, mutation } from './_generated/server';
import { Descriptions } from './data/characters';
import { insertInput } from './game/main';
import { initAgent } from './agent/init';

export const init = mutation({
  args: {
    numAgents: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const defaultWorld = await ctx.db
      .query('worlds')
      .filter((q) => q.eq(q.field('isDefault'), true))
      .first();
    if (defaultWorld) {
      throw new Error(`Default world already exists`);
    }
    const now = Date.now();
    const generationNumber = 0;
    const engineId = await ctx.db.insert('engines', {
      active: true,
      currentTime: now,
      generationNumber,
      idleUntil: now,
    });
    const worldId = await ctx.db.insert('worlds', { engineId, isDefault: true, lastViewed: now });
    console.log(`Starting world ${worldId}...`);
    ctx.scheduler.runAt(now, api.game.main.runStep, {
      engineId,
      generationNumber,
    });

    // Send inputs to create players for all of the agents.
    if (args.numAgents) {
      for (let i = 0; i < Math.min(args.numAgents, Descriptions.length); i++) {
        const agent = Descriptions[i];
        const inputId = await insertInput(ctx, engineId, 'join', {
          name: agent.name,
          description: agent.identity,
          character: agent.character,
        });
        ctx.scheduler.runAfter(2000, internal.init.completeAgentCreation, {
          joinInputId: inputId,
          character: agent.character,
        });
      }
    }
  },
});

export const completeAgentCreation = internalMutation({
  args: {
    joinInputId: v.id('inputs'),
    character: v.string(),
  },
  handler: async (ctx, args) => {
    const input = await ctx.db.get(args.joinInputId);
    if (!input || input.name !== 'join') {
      throw new Error(`Invalid input ID ${args.joinInputId}`);
    }
    const { returnValue } = input;
    if (!returnValue) {
      console.warn(`Input ${input._id} not ready, waiting...`);
      ctx.scheduler.runAfter(5000, internal.init.completeAgentCreation, args);
      return;
    }
    if (returnValue.kind === 'error') {
      throw new Error(`Error creating agent: ${returnValue.message}`);
    }
    const playerId = returnValue.value;
    const existingAgent = await ctx.db
      .query('agents')
      .withIndex('playerId', (q) => q.eq('playerId', playerId))
      .first();
    if (existingAgent) {
      throw new Error(`Agent for player ${playerId} already exists`);
    }
    await initAgent(ctx, { playerId, character: args.character });
  },
});
