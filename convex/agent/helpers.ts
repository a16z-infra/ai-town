import { v } from 'convex/values';
import { ActionCtx, internalMutation, internalQuery } from '../_generated/server';
import { InputArgs, InputNames } from '../game/inputs';
import { insertInput } from '../game/main';
import { internal } from '../_generated/api';
import { Id } from '../_generated/dataModel';
import { tryStartTyping, writeMessage } from '../messages';
import { Lock } from '../util/lock';
import { loadScheduler } from './init';

// We currently run into OCC errors if the agents all running in the same
// batched action all try to send an input at the same time. Rather than
// trying to jitter them, we just serialize sending inputs to the game
// engine.
const inputLock = new Lock();

export async function sendInput<Name extends InputNames>(
  ctx: ActionCtx,
  agentId: Id<'agents'>,
  generationNumber: number,
  name: Name,
  args: InputArgs<Name>,
): Promise<void> {
  await inputLock.withLock(async () => {
    await ctx.runMutation(internal.agent.helpers.sendAgentInput, {
      agentId,
      generationNumber,
      name,
      args,
    });
  });
}

export const loadState = internalQuery({
  args: {
    agentId: v.id('agents'),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      throw new Error(`Invalid agent ID: ${args.agentId}`);
    }
    return {
      worldId: agent.worldId,
      playerId: agent.playerId,
    };
  },
});

export const sendAgentInput = internalMutation({
  args: {
    agentId: v.id('agents'),
    generationNumber: v.number(),
    name: v.string(),
    args: v.any(),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      throw new Error(`Invalid agent ID: ${args.agentId}`);
    }
    const scheduler = await loadScheduler(ctx, agent.worldId);
    if (scheduler.generationNumber !== args.generationNumber) {
      throw new Error(
        `Scheduler generation number mismatch: ${scheduler.generationNumber} != ${args.generationNumber}`,
      );
    }
    const inputId = await insertInput(ctx, agent.worldId, args.name as InputNames, args.args);
    agent.inProgressInputs.push({ inputId, submitted: Date.now() });
    await ctx.db.replace(args.agentId, agent);
  },
});

export const removeInProgressInputs = internalMutation({
  args: {
    agentId: v.id('agents'),
    generationNumber: v.number(),
    inputIds: v.array(v.id('inputs')),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      throw new Error(`Invalid agent ID: ${args.agentId}`);
    }
    const scheduler = await loadScheduler(ctx, agent.worldId);
    if (scheduler.generationNumber !== args.generationNumber) {
      throw new Error(
        `Scheduler generation number mismatch: ${scheduler.generationNumber} != ${args.generationNumber}`,
      );
    }
    agent.inProgressInputs = agent.inProgressInputs.filter(
      (input) => !args.inputIds.includes(input.inputId),
    );
    await ctx.db.replace(args.agentId, agent);
  },
});

export const agentStartTyping = internalMutation({
  args: {
    agentId: v.id('agents'),
    generationNumber: v.number(),
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      throw new Error(`Invalid agent ID: ${args.agentId}`);
    }
    const scheduler = await loadScheduler(ctx, agent.worldId);
    if (scheduler.generationNumber !== args.generationNumber) {
      throw new Error(
        `Scheduler generation number mismatch: ${scheduler.generationNumber} != ${args.generationNumber}`,
      );
    }
    const result = await tryStartTyping(ctx, args.conversationId, agent.playerId);
    return result === 'ok';
  },
});

export const agentWriteMessage = internalMutation({
  args: {
    agentId: v.id('agents'),
    generationNumber: v.number(),
    conversationId: v.id('conversations'),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      throw new Error(`Invalid agent ID: ${args.agentId}`);
    }
    const scheduler = await loadScheduler(ctx, agent.worldId);
    if (scheduler.generationNumber !== args.generationNumber) {
      throw new Error(
        `Scheduler generation number mismatch: ${scheduler.generationNumber} != ${args.generationNumber}`,
      );
    }
    await writeMessage(ctx, {
      conversationId: args.conversationId,
      playerId: agent.playerId,
      text: args.text,
    });
  },
});
