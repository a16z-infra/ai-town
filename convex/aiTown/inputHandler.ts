import { ObjectType, PropertyValidators } from 'convex/values';
import { Game } from './game';

export function inputHandler<ArgsValidator extends PropertyValidators, Return extends any>(def: {
  args: ArgsValidator;
  handler: (game: Game, now: number, args: ObjectType<ArgsValidator>) => Return;
}) {
  return def;
}
