import { ObjectType, PropertyValidators } from 'convex/values';
import { AiTown } from './aiTown';

export function inputHandler<ArgsValidator extends PropertyValidators, Return extends any>(def: {
  args: ArgsValidator;
  handler: (game: AiTown, now: number, args: ObjectType<ArgsValidator>) => Promise<Return>;
}) {
  return def;
}
