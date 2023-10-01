import { Infer, v } from 'convex/values';
import { point } from '../util/types';

export const inputs = {
  // Join, creating a new player...
  join: {
    args: v.object({
      name: v.string(),
      character: v.string(),
      description: v.string(),
      tokenIdentifier: v.optional(v.string()),
    }),
    returnValue: v.id('players'),
  },
  // ...or leave, disabling the specified player.
  leave: {
    args: v.object({
      playerId: v.id('players'),
    }),
    returnValue: v.null(),
  },

  // Move the player to a specified location.
  moveTo: {
    args: v.object({
      playerId: v.id('players'),
      destination: v.union(point, v.null()),
    }),
    returnValue: v.null(),
  },
  // Start a conversation, inviting the specified player.
  // Conversations can only have two participants for now,
  // so we don't have a separate "invite" input.
  startConversation: {
    args: v.object({
      playerId: v.id('players'),
      invitee: v.id('players'),
    }),
    returnValue: v.id('conversations'),
  },
  // Accept an invite to a conversation, which puts the
  // player in the "walkingOver" state until they're close
  // enough to the other participant.
  acceptInvite: {
    args: v.object({
      playerId: v.id('players'),
      conversationId: v.id('conversations'),
    }),
    returnValue: v.null(),
  },
  // Reject the invite. Eventually we might add a message
  // that explains why!
  rejectInvite: {
    args: v.object({
      playerId: v.id('players'),
      conversationId: v.id('conversations'),
    }),
    returnValue: v.null(),
  },
  // Leave a conversation.
  leaveConversation: {
    args: v.object({
      playerId: v.id('players'),
      conversationId: v.id('conversations'),
    }),
    returnValue: v.null(),
  },
};
export type Inputs = typeof inputs;
export type InputNames = keyof Inputs;
export type InputArgs<Name extends InputNames> = Infer<Inputs[Name]['args']>;
export type InputReturnValue<Name extends InputNames> = Infer<Inputs[Name]['returnValue']>;
