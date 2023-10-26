import { ObjectType } from 'convex/values';
import { playerInputs } from './player';
import { conversationInputs } from './conversation';
import { agentInputs } from './agentInputs';

// It's easy to hit circular dependencies with these imports
if (playerInputs === undefined || conversationInputs === undefined || agentInputs === undefined) {
  throw new Error("Input map is undefined, check if there's a circular import.");
}
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
