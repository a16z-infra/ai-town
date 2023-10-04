import { v } from 'convex/values';
import {
  DatabaseReader,
  MutationCtx,
  internalMutation,
  mutation,
  query,
} from '../_generated/server';
import { AiTown } from './aiTown';
import { api, internal } from '../_generated/api';
import { insertInput as gameInsertInput } from '../engine/game';
import { InputArgs, InputNames } from './inputs';
import { Id } from '../_generated/dataModel';

async function getWorldId(db: DatabaseReader, engineId: Id<'engines'>) {
  const world = await db
    .query('worlds')
    .withIndex('engineId', (q) => q.eq('engineId', engineId))
    .first();
  if (!world) {
    throw new Error(`World for engine ${engineId} not found`);
  }
  return world._id;
}

export const runStep = internalMutation({
  args: {
    engineId: v.id('engines'),
    generationNumber: v.number(),
  },
  handler: async (ctx, args): Promise<void> => {
    const worldId = await getWorldId(ctx.db, args.engineId);
    const game = await AiTown.load(ctx.db, worldId);
    await game.runStep(ctx, internal.game.main.runStep, args.generationNumber);
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
  return await gameInsertInput(ctx, internal.game.main.runStep, world.engineId, name, args);
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
