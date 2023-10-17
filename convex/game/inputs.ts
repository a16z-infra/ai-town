import { Id } from '../_generated/dataModel';
import { blocked } from './movement';
import { characters } from '../../data/characters';
import { agentInputs } from './agents';
import { ObjectType, PropertyValidators, v } from 'convex/values';
import { movePlayer } from './movement';
import * as conversationMembers from './conversationMembers';
import * as conversations from './conversations';
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
} as const);
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
      conversations.stopConversation(game, now, conversation);
    }
    player.active = false;
    return null;
  },
} as const);
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
// Start a conversation, inviting the specified player.
// Conversations can only have two participants for now,
// so we don't have a separate "invite" input.
const startConversation = inputHandler({
  args: {
    playerId: v.id('players'),
    invitee: v.id('players'),
  },
  handler: async (
    game: AiTown,
    now: number,
    { playerId, invitee },
  ): Promise<Id<'conversations'>> => {
    console.log(`Starting ${playerId} ${invitee}...`);
    const { conversationId, error } = await conversations.startConversation(
      game,
      playerId,
      invitee,
    );
    if (!conversationId) {
      // TODO: pass it back to the client for them to show an error.
      throw new Error(error);
    }
    return conversationId;
  },
});
// Accept an invite to a conversation, which puts the
// player in the "walkingOver" state until they're close
// enough to the other participant.
const acceptInvite = inputHandler({
  args: {
    playerId: v.id('players'),
    conversationId: v.id('conversations'),
  },
  handler: async (game: AiTown, now: number, { playerId, conversationId }): Promise<null> => {
    conversationMembers.acceptInvite(game, playerId, conversationId);
    return null;
  },
});
// Reject the invite. Eventually we might add a message
// that explains why!
const rejectInvite = inputHandler({
  args: {
    playerId: v.id('players'),
    conversationId: v.id('conversations'),
  },
  handler: async (game: AiTown, now: number, { playerId, conversationId }): Promise<null> => {
    conversationMembers.rejectInvite(game, now, playerId, conversationId);
    return null;
  },
});
// Leave a conversation.
const leaveConversation = inputHandler({
  args: {
    playerId: v.id('players'),
    conversationId: v.id('conversations'),
  },
  handler: async (game: AiTown, now: number, { playerId, conversationId }): Promise<null> => {
    conversationMembers.leaveConversation(game, now, playerId, conversationId);
    return null;
  },
});
// Inputs for the messaging layer.
const startTyping = inputHandler({
  args: {
    playerId: v.id('players'),
    conversationId: v.id('conversations'),
    messageUuid: v.string(),
  },
  handler: async (
    game: AiTown,
    now: number,
    { playerId, conversationId, messageUuid },
  ): Promise<null> => {
    const conversation = game.conversations.lookup(conversationId);
    if (!conversation) {
      throw new Error(`Invalid conversation ID: ${conversationId}`);
    }
    if (conversation.isTyping && conversation.isTyping.playerId !== playerId) {
      throw new Error(
        `Player ${conversation.isTyping.playerId} is already typing in ${conversationId}`,
      );
    }
    conversation.isTyping = { playerId, messageUuid, since: now };
    return null;
  },
});

export const finishSendingMessage = inputHandler({
  args: {
    playerId: v.id('players'),
    conversationId: v.id('conversations'),
    timestamp: v.number(),
  },
  handler: async (
    game: AiTown,
    now: number,
    { playerId, conversationId, timestamp },
  ): Promise<null> => {
    const conversation = game.conversations.lookup(conversationId);
    if (!conversation) {
      throw new Error(`Invalid conversation ID: ${conversationId}`);
    }
    if (conversation.finished) {
      throw new Error(`Conversation is finished: ${conversationId}`);
    }
    if (conversation.isTyping && conversation.isTyping.playerId === playerId) {
      delete conversation.isTyping;
    }
    conversation.lastMessage = { author: playerId, timestamp };
    conversation.numMessages++;
    return null;
  },
});

export const inputs = {
  join,
  leave,
  moveTo,
  startConversation,
  acceptInvite,
  rejectInvite,
  leaveConversation,
  startTyping,
  finishSendingMessage,
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
