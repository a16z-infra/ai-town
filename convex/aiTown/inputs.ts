import { ObjectType } from 'convex/values';
import { playerInputs } from './player';
import { conversationInputs } from './conversation';
import { agentInputs } from './agentInputs';
import { MutationCtx } from '../_generated/server';
import { Id } from '../_generated/dataModel';
import { engineInsertInput } from '../engine/abstractGame';

export const inputs = {
  ...playerInputs,
  // Inputs for the messaging layer.
  ...conversationInputs,
  // Inputs for the agent layer.
  ...agentInputs,
};
export type Inputs = typeof inputs;
export type InputNames = keyof Inputs;
export type InputArgs<Name extends InputNames> = ObjectType<Inputs[Name]['args']>;
export type InputReturnValue<Name extends InputNames> = ReturnType<
  Inputs[Name]['handler']
> extends Promise<infer T>
  ? T
  : never;

export async function insertInput<Name extends InputNames>(
  ctx: MutationCtx,
  worldId: Id<'worlds'>,
  name: Name,
  args: InputArgs<Name>,
): Promise<Id<'inputs'>> {
  const worldStatus = await ctx.db
    .query('worldStatus')
    .withIndex('worldId', (q) => q.eq('worldId', worldId))
    .unique();
  if (!worldStatus) {
    throw new Error(`World for engine ${worldId} not found`);
  }
  return await engineInsertInput(ctx, worldStatus.engineId, name, args);
}
