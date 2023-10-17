import { blocked } from './movement';
import { characters } from '../../data/characters';
import { agentInputs } from './agents';
import { ObjectType, PropertyValidators, v } from 'convex/values';
import { movePlayer } from './movement';
import { conversationMembersInputs } from './conversationMembers';
import { conversationInputs, stopConversation } from './conversations';
import { point } from '../util/types';
import { AiTown } from './aiTown';

export function inputHandler<ArgsValidator extends PropertyValidators, Return extends any>(def: {
  args: ArgsValidator;
  handler: (game: AiTown, now: number, args: ObjectType<ArgsValidator>) => Promise<Return>;
}) {
  return def;
}
// Join, creating a new player...

export const join = inputHandler({
  args: {
    name: v.string(),
    character: v.string(),
    description: v.string(),
    tokenIdentifier: v.optional(v.string()),
  },
  handler: async (game, now, args) => {
    const { name, character, description, tokenIdentifier } = args;
    const players = game.players.allDocuments();
    let position;
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = {
        x: Math.floor(Math.random() * game.map.width),
        y: Math.floor(Math.random() * game.map.height),
      };
      if (blocked(game, now, candidate)) {
        continue;
      }
      position = candidate;
      break;
    }
    if (!position) {
      throw new Error(`Failed to find a free position!`);
    }
    const facingOptions = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
    ];
    const facing = facingOptions[Math.floor(Math.random() * facingOptions.length)];
    if (!characters.find((c) => c.name === character)) {
      throw new Error(`Invalid character: ${character}`);
    }
    const locationId = await game.locations.insert(now, {
      x: position.x,
      y: position.y,
      dx: facing.dx,
      dy: facing.dy,
      velocity: 0,
    });
    const playerId = await game.players.insert({
      worldId: game.world._id,
      name,
      description,
      active: true,
      human: tokenIdentifier,
      character,
      locationId,
    });
    return playerId;
  },
});
// ...or leave, disabling the specified player.
const leave = inputHandler({
  args: {
    playerId: v.id('players'),
  },
  handler: async (game: AiTown, now: number, { playerId }) => {
    const player = game.players.lookup(playerId);
    // Stop our conversation if we're leaving the game.
    const membership = game.conversationMembers.find((m) => m.playerId === playerId);
    if (membership) {
      const conversation = game.conversations.find((d) => d._id === membership.conversationId);
      if (conversation === null) {
        throw new Error(`Couldn't find conversation: ${membership.conversationId}`);
      }
      stopConversation(game, now, conversation);
    }
    player.active = false;
    return null;
  },
});
// Move the player to a specified location.
const moveTo = inputHandler({
  args: {
    playerId: v.id('players'),
    destination: v.union(point, v.null()),
  },
  handler: async (game: AiTown, now: number, { playerId, destination }) => {
    movePlayer(game, now, playerId, destination);
    return null;
  },
});
export const inputs = {
  join,
  leave,
  moveTo,
  // Inputs for the messaging layer.
  ...conversationInputs,
  ...conversationMembersInputs,
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
