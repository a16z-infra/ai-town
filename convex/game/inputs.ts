import { Infer, v } from 'convex/values';
import { point } from '../util/types';
import { AiTown } from './aiTown';
import { assertNever } from '../util/assertNever';
import { Descriptions, characters } from '../../data/characters';
import { blocked, movePlayer } from './movement';
import { acceptInvite, leaveConversation, rejectInvite } from './conversationMembers';
import { startConversation, stopConversation } from './conversations';
import { activity } from './players';

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

  // Inputs for the messaging layer.
  startTyping: {
    args: v.object({
      playerId: v.id('players'),
      conversationId: v.id('conversations'),
      messageUuid: v.string(),
    }),
    returnValue: v.null(),
  },
  finishSendingMessage: {
    args: v.object({
      playerId: v.id('players'),
      conversationId: v.id('conversations'),
      timestamp: v.number(),
    }),
    returnValue: v.null(),
  },

  // Inputs for the agent layer.
  createAgent: {
    args: v.object({
      descriptionIndex: v.number(),
    }),
    returnValue: v.null(),
  },
  finishRememberConversation: {
    args: v.object({
      operationId: v.string(),
      agentId: v.id('agents'),
    }),
    returnValue: v.null(),
  },
  finishDoSomething: {
    args: v.object({
      operationId: v.string(),
      agentId: v.id('agents'),
      destination: v.optional(point),
      invitee: v.optional(v.id('players')),
      activity: v.optional(activity),
    }),
    returnValue: v.null(),
  },
  agentFinishSendingMessage: {
    args: v.object({
      agentId: v.id('agents'),
      conversationId: v.id('conversations'),
      timestamp: v.number(),
      operationId: v.string(),
      leaveConversation: v.boolean(),
    }),
    returnValue: v.null(),
  },
};
export type Inputs = typeof inputs;
export type InputNames = keyof Inputs;
export type InputArgs<Name extends InputNames> = Infer<Inputs[Name]['args']>;
export type InputReturnValue<Name extends InputNames> = Infer<Inputs[Name]['returnValue']>;

export async function handleInput(
  game: AiTown,
  now: number,
  name: keyof Inputs,
  args: InputArgs<typeof name>,
): Promise<InputReturnValue<typeof name>> {
  switch (name) {
    case 'join':
      return await handleJoin(game, now, args as any);
    case 'leave':
      return await handleLeave(game, now, args as any);
    case 'moveTo':
      return await handleMoveTo(game, now, args as any);
    case 'startConversation':
      return await handleStartConversation(game, now, args as any);
    case 'acceptInvite':
      return await handleAcceptInvite(game, now, args as any);
    case 'rejectInvite':
      return await handleRejectInvite(game, now, args as any);
    case 'leaveConversation':
      return await handleLeaveConversation(game, now, args as any);
    case 'startTyping':
      return await handleStartTyping(game, now, args as any);
    case 'finishSendingMessage':
      return await handleFinishSendingMessage(game, now, args as any);
    case 'createAgent':
      return await handleCreateAgent(game, now, args as any);
    case 'finishRememberConversation':
      return await handleFinishRememberConversation(game, now, args as any);
    case 'finishDoSomething':
      return await handleFinishDoSomething(game, now, args as any);
    case 'agentFinishSendingMessage':
      return await handleAgentFinishSendingMessage(game, now, args as any);
    default:
      assertNever(name);
  }
}

async function handleJoin(
  game: AiTown,
  now: number,
  { name, description, tokenIdentifier, character }: InputArgs<'join'>,
): Promise<InputReturnValue<'join'>> {
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
}

async function handleLeave(
  game: AiTown,
  now: number,
  { playerId }: InputArgs<'leave'>,
): Promise<InputReturnValue<'leave'>> {
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
}

async function handleMoveTo(
  game: AiTown,
  now: number,
  { playerId, destination }: InputArgs<'moveTo'>,
): Promise<InputReturnValue<'moveTo'>> {
  movePlayer(game, now, playerId, destination);
  return null;
}

async function handleStartConversation(
  game: AiTown,
  now: number,
  { playerId, invitee }: InputArgs<'startConversation'>,
): Promise<InputReturnValue<'startConversation'>> {
  console.log(`Starting ${playerId} ${invitee}...`);
  const { conversationId, error } = await startConversation(game, playerId, invitee);
  if (!conversationId) {
    // TODO: pass it back to the client for them to show an error.
    throw new Error(error);
  }
  return conversationId;
}

async function handleAcceptInvite(
  game: AiTown,
  now: number,
  { playerId, conversationId }: InputArgs<'acceptInvite'>,
): Promise<InputReturnValue<'acceptInvite'>> {
  acceptInvite(game, playerId, conversationId);
  return null;
}

async function handleRejectInvite(
  game: AiTown,
  now: number,
  { playerId, conversationId }: InputArgs<'rejectInvite'>,
): Promise<InputReturnValue<'rejectInvite'>> {
  rejectInvite(game, now, playerId, conversationId);
  return null;
}

async function handleLeaveConversation(
  game: AiTown,
  now: number,
  { playerId, conversationId }: InputArgs<'leaveConversation'>,
): Promise<InputReturnValue<'leaveConversation'>> {
  leaveConversation(game, now, playerId, conversationId);
  return null;
}

async function handleStartTyping(
  game: AiTown,
  now: number,
  { playerId, conversationId, messageUuid }: InputArgs<'startTyping'>,
): Promise<InputReturnValue<'startTyping'>> {
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
}

async function handleFinishSendingMessage(
  game: AiTown,
  now: number,
  { playerId, conversationId, timestamp }: InputArgs<'finishSendingMessage'>,
): Promise<InputReturnValue<'finishSendingMessage'>> {
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
}

async function handleCreateAgent(
  game: AiTown,
  now: number,
  { descriptionIndex }: InputArgs<'createAgent'>,
): Promise<InputReturnValue<'createAgent'>> {
  const description = Descriptions[descriptionIndex];
  if (!description) {
    throw new Error(`Invalid description index: ${descriptionIndex}`);
  }
  const playerId = await handleJoin(game, now, {
    name: description.name,
    description: description.identity,
    character: description.character,
  });
  await game.agents.insert({
    worldId: game.world._id,
    playerId,
    identity: description.identity,
    plan: description.plan,
  });
  return null;
}

async function handleFinishRememberConversation(
  game: AiTown,
  now: number,
  { operationId, agentId }: InputArgs<'finishRememberConversation'>,
): Promise<InputReturnValue<'finishRememberConversation'>> {
  const agent = game.agents.lookup(agentId);
  if (!agent.inProgressOperation || agent.inProgressOperation.operationId !== operationId) {
    console.debug(`Agent ${agentId} isn't remembering ${operationId}`);
  } else {
    delete agent.inProgressOperation;
    delete agent.toRemember;
  }
  return null;
}

async function handleFinishDoSomething(
  game: AiTown,
  now: number,
  { operationId, agentId, activity, destination, invitee }: InputArgs<'finishDoSomething'>,
): Promise<InputReturnValue<'finishDoSomething'>> {
  const agent = game.agents.lookup(agentId);
  if (!agent.inProgressOperation || agent.inProgressOperation.operationId !== operationId) {
    console.debug(`Agent ${agentId} wasn't looking for a conversation ${operationId}`);
  } else {
    delete agent.inProgressOperation;
    const player = game.players.lookup(agent.playerId);
    if (invitee) {
      agent.lastInviteAttempt = now;
      await startConversation(game, agent.playerId, invitee);
    }
    if (destination) {
      movePlayer(game, now, agent.playerId, destination);
    }
    if (activity) {
      player.activity = activity;
    }
    // TODO: remove once we're going to destinations intentionally
    if (!invitee && !activity) {
      movePlayer(game, now, player._id, {
        x: 1 + Math.floor(Math.random() * (game.map.width - 2)),
        y: 1 + Math.floor(Math.random() * (game.map.height - 2)),
      });
    }
  }
  return null;
}

async function handleAgentFinishSendingMessage(
  game: AiTown,
  now: number,
  {
    agentId,
    conversationId,
    timestamp,
    leaveConversation: shouldLeave,
    operationId,
  }: InputArgs<'agentFinishSendingMessage'>,
): Promise<InputReturnValue<'agentFinishSendingMessage'>> {
  const agent = game.agents.lookup(agentId);
  if (!agent.inProgressOperation || agent.inProgressOperation.operationId !== operationId) {
    console.debug(`Agent ${agentId} wasn't sending a message ${operationId}`);
    return null;
  }
  delete agent.inProgressOperation;
  handleFinishSendingMessage(game, now, {
    playerId: agent.playerId,
    conversationId,
    timestamp,
  });
  if (shouldLeave) {
    leaveConversation(game, now, agent.playerId, conversationId);
  }
  return null;
}
