import { ObjectType, PropertyValidators, Value } from 'convex/values';
import type { Game } from './game';

export function inputHandler<ArgsValidator extends PropertyValidators, Return extends Value>(def: {
  args: ArgsValidator;
  handler: (game: Game, now: number, args: ObjectType<ArgsValidator>) => Return;
}) {
  return def;
}
