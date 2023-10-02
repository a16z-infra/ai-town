import { v } from 'convex/values';
import { MutationCtx, mutation, query } from '../_generated/server';
import { AiTown } from './aiTown';
import { api } from '../_generated/api';
import { insertInput as gameInsertInput } from '../engine/game';
import { InputArgs, InputNames } from './inputs';
import { Id } from '../_generated/dataModel';

export const runStep = mutation({
  args: {
    worldId: v.id('worlds'),
    generationNumber: v.number(),
  },
  handler: async (ctx, args): Promise<void> => {
    const game = await AiTown.load(ctx.db, args.worldId);
    const { idleUntil, generationNumber } = await game.runStep(ctx, args.generationNumber);
    await ctx.scheduler.runAt(idleUntil, api.game.main.runStep, {
      worldId: args.worldId,
      generationNumber,
    });
  },
});

export async function insertInput<Name extends InputNames>(
  ctx: MutationCtx,
  worldId: Id<'worlds'>,
  name: Name,
  args: InputArgs<Name>,
): Promise<Id<'inputs'>> {
  const world = await ctx.db.get(worldId);
  if (!world) {
    throw new Error(`Invalid world ID: ${worldId}`);
  }
  const { inputId, preemption } = await gameInsertInput(ctx, world.engineId, name, args);
  if (preemption) {
    const { now, generationNumber } = preemption;
    await ctx.scheduler.runAt(now, api.game.main.runStep, {
      worldId,
      generationNumber,
    });
  }
  return inputId;
}

export const sendInput = mutation({
  args: {
    worldId: v.id('worlds'),
    name: v.string(),
    args: v.any(),
  },
  handler: async (ctx, args) => {
    return await insertInput(ctx, args.worldId, args.name as InputNames, args.args);
  },
});

export const inputStatus = query({
  args: {
    inputId: v.id('inputs'),
  },
  handler: async (ctx, args) => {
    const input = await ctx.db.get(args.inputId);
    if (!input) {
      throw new Error(`Invalid input ID: ${args.inputId}`);
    }
    return input.returnValue ?? null;
  },
});
