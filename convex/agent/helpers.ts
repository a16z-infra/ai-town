import { v } from 'convex/values';
import { ActionCtx, internalMutation, internalQuery } from '../_generated/server';
import { InputArgs, InputNames } from '../game/inputs';
import { insertInput } from '../game/main';
import { internal } from '../_generated/api';
import { Id } from '../_generated/dataModel';
import { tryStartTyping } from '../messages';

export async function sendInput<Name extends InputNames>(
  ctx: ActionCtx,
  agentId: Id<'agents'>,
  name: Name,
  args: InputArgs<Name>,
): Promise<void> {
  await ctx.runMutation(internal.agent.helpers.sendAgentInput, { agentId, name, args });
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
    name: v.string(),
    args: v.any(),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      throw new Error(`Invalid agent ID: ${args.agentId}`);
    }
    const inputId = await insertInput(ctx, agent.worldId, args.name as InputNames, args.args);
    agent.inProgressInputs.push({ inputId, submitted: Date.now() });
    await ctx.db.replace(args.agentId, agent);
  },
});

export const removeInProgressInputs = internalMutation({
  args: {
    agentId: v.id('agents'),
    inputIds: v.array(v.id('inputs')),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      throw new Error(`Invalid agent ID: ${args.agentId}`);
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
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      throw new Error(`Invalid agent ID: ${args.agentId}`);
    }
    const result = await tryStartTyping(ctx, args.conversationId, agent.playerId);
    return result === 'ok';
  },
});
