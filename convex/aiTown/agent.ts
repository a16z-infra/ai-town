import { Infer, v } from 'convex/values';
import { GameId, parseGameId } from './ids';
import { agentId, conversationId, playerId } from './ids';
import { Player, activity, joinGame, player } from './player';
import { Game } from './game';
import {
  ACTION_TIMEOUT,
  AWKWARD_CONVERSATION_TIMEOUT,
  CONVERSATION_COOLDOWN,
  CONVERSATION_DISTANCE,
  INVITE_ACCEPT_PROBABILITY,
  INVITE_TIMEOUT,
  MAX_CONVERSATION_DURATION,
  MAX_CONVERSATION_MESSAGES,
  MESSAGE_COOLDOWN,
  MIDPOINT_THRESHOLD,
  PLAYER_CONVERSATION_COOLDOWN,
} from '../constants';
import { FunctionArgs } from 'convex/server';
import { MutationCtx, internalMutation, internalQuery } from '../_generated/server';
import { distance } from '../util/geometry';
import { internal } from '../_generated/api';
import {
  acceptInvite,
  conversationInputs,
  leaveConversation,
  rejectInvite,
  setIsTyping,
  startConversation,
} from './conversation';
import { movePlayer } from './movement';
import { inputHandler } from './inputHandler';
import { point } from '../util/types';
import { insertInput } from './inputs';
import { Descriptions } from '../../data/characters';

export const agentFields = {
  id: agentId,
  playerId: playerId,
  toRemember: v.optional(conversationId),
  lastConversation: v.optional(v.number()),
  lastInviteAttempt: v.optional(v.number()),
  inProgressOperation: v.optional(
    v.object({
      name: v.string(),
      operationId: v.string(),
      started: v.number(),
    }),
  ),
};
export const agent = v.object(agentFields);
type AgentDoc = Infer<typeof agent>;
export type Agent = {
  id: GameId<'agents'>;
  playerId: GameId<'players'>;
  toRemember?: GameId<'conversations'>;
  lastConversation?: number;
  lastInviteAttempt?: number;
  inProgressOperation?: {
    name: string;
    operationId: string;
    started: number;
  };
};
export const agentDescriptionFields = {
  agentId,
  identity: v.string(),
  plan: v.string(),
};
const agentDescription = v.object(agentDescriptionFields);
type AgentDescriptionDoc = Infer<typeof agentDescription>;
export type AgentDescription = {
  agentId: GameId<'agents'>;
  identity: string;
  plan: string;
};

function parseAgent(
  players: Map<GameId<'players'>, Player>,
  agent: AgentDoc,
  nextId: number,
): Agent {
  const { id, lastConversation, lastInviteAttempt, inProgressOperation } = agent;
  const playerId = parseGameId('players', agent.playerId, nextId);
  if (!players.has(playerId)) {
    throw new Error(`Invalid player ID ${playerId}`);
  }
  return {
    id: parseGameId('agents', id, nextId),
    playerId,
    toRemember:
      agent.toRemember !== undefined
        ? parseGameId('conversations', agent.toRemember, nextId)
        : undefined,
    lastConversation,
    lastInviteAttempt,
    inProgressOperation,
  };
}

export function parseAgents(
  players: Map<GameId<'players'>, Player>,
  agents: AgentDoc[],
  nextId: number,
): Map<GameId<'agents'>, Agent> {
  const result: Map<GameId<'agents'>, Agent> = new Map();
  for (const agent of agents) {
    const parsed = parseAgent(players, agent, nextId);
    if (result.has(parsed.id)) {
      throw new Error(`Duplicate agent id ${parsed.id}`);
    }
    result.set(parsed.id, parsed);
  }
  return result;
}

export function parseAgentDescriptions(
  agents: Map<GameId<'agents'>, Agent>,
  agentDescriptions: AgentDescriptionDoc[],
  nextId: number,
): Map<GameId<'agents'>, AgentDescription> {
  const result: Map<GameId<'agents'>, AgentDescription> = new Map();
  for (const description of agentDescriptions) {
    const id = parseGameId('agents', description.agentId, nextId);
    if (!agents.has(id)) {
      throw new Error(`Invalid agent ID ${id}`);
    }
    if (result.has(id)) {
      throw new Error(`Duplicate agent description for ${id}`);
    }
    result.set(id, {
      agentId: id,
      identity: description.identity,
      plan: description.plan,
    });
  }
  return result;
}
export function tickAgent(game: Game, now: number, agent: Agent) {
  const player = game.players.get(agent.playerId);
  if (!player) {
    throw new Error(`Invalid player ID ${agent.playerId}`);
  }
  if (agent.inProgressOperation) {
    if (now < agent.inProgressOperation.started + ACTION_TIMEOUT) {
      // Wait on the operation to finish.
      return;
    }
    console.log(`Timing out ${JSON.stringify(agent.inProgressOperation)}`);
    delete agent.inProgressOperation;
  }
  const conversation = [...game.conversations.values()].find((c) => c.participants.has(player.id));
  const member = conversation?.participants.get(player.id);

  const recentlyAttemptedInvite =
    agent.lastInviteAttempt && now < agent.lastInviteAttempt + CONVERSATION_COOLDOWN;
  const doingActivity = player.activity && player.activity.until > now;
  if (doingActivity && (conversation || player.pathfinding)) {
    player.activity!.until = now;
  }
  // If we're not in a conversation, do something.
  // If we aren't doing an activity or moving, do something.
  // If we have been wandering but haven't thought about something to do for
  // a while, do something.
  if (!conversation && !doingActivity && (!player.pathfinding || !recentlyAttemptedInvite)) {
    startOperation(game, now, agent, 'agentDoSomething', {
      worldId: game.worldId,
      player,
      otherFreePlayers: [...game.players.values()]
        .filter((p) => p.id !== player.id)
        .filter((p) => ![...game.conversations.values()].find((c) => c.participants.has(p.id))),
      agent,
      map: game.worldMap,
    });
    return;
  }
  // Check to see if we have a conversation we need to remember.
  if (agent.toRemember) {
    // Fire off the action to remember the conversation.
    console.log(`Agent ${agent.id} remembering conversation ${agent.toRemember}`);
    startOperation(game, now, agent, 'agentRememberConversation', {
      worldId: game.worldId,
      playerId: agent.playerId,
      agentId: agent.id,
      conversationId: agent.toRemember,
    });
    delete agent.toRemember;
    return;
  }
  if (conversation && member) {
    const [otherPlayerId, otherMember] = [...conversation.participants.entries()].find(
      ([id]) => id !== player.id,
    )!;
    const otherPlayer = game.players.get(otherPlayerId)!;
    if (member.status.kind === 'invited') {
      // Accept a conversation with another agent with some probability and with
      // a human unconditionally.
      if (otherPlayer.human || Math.random() < INVITE_ACCEPT_PROBABILITY) {
        console.log(`Agent ${player.id} accepting invite from ${otherPlayer.id}`);
        acceptInvite(game, player, conversation);
        // Stop moving so we can start walking towards the other player.
        if (player.pathfinding) {
          delete player.pathfinding;
        }
      } else {
        console.log(`Agent ${player.id} rejecting invite from ${otherPlayer.id}`);
        rejectInvite(game, now, player, conversation);
      }
      return;
    }
    if (member.status.kind === 'walkingOver') {
      // Leave a conversation if we've been waiting for too long.
      if (member.invited + INVITE_TIMEOUT < now) {
        console.log(`Giving up on invite to ${otherPlayer.id}`);
        leaveConversation(game, now, player, conversation);
        return;
      }

      // Don't keep moving around if we're near enough.
      const playerDistance = distance(player.position, otherPlayer.position);
      if (playerDistance < CONVERSATION_DISTANCE) {
        return;
      }

      // Keep moving towards the other player.
      // If we're close enough to the player, just walk to them directly.
      if (!player.pathfinding) {
        let destination;
        if (playerDistance < MIDPOINT_THRESHOLD) {
          destination = {
            x: Math.floor(otherPlayer.position.x),
            y: Math.floor(otherPlayer.position.y),
          };
        } else {
          destination = {
            x: Math.floor((player.position.x + otherPlayer.position.x) / 2),
            y: Math.floor((player.position.y + otherPlayer.position.y) / 2),
          };
        }
        console.log(`Agent ${player.id} walking towards ${otherPlayer.id}...`, destination);
        movePlayer(game, now, player, destination);
      }
      return;
    }
    if (member.status.kind === 'participating') {
      const started = member.status.started;
      if (conversation.isTyping && conversation.isTyping.playerId !== player.id) {
        // Wait for the other player to finish typing.
        return;
      }
      if (!conversation.lastMessage) {
        const isInitiator = conversation.creator === player.id;
        const awkwardDeadline = started + AWKWARD_CONVERSATION_TIMEOUT;
        // Send the first message if we're the initiator or if we've been waiting for too long.
        if (isInitiator || awkwardDeadline < now) {
          // Grab the lock on the conversation and send a "start" message.
          console.log(`${player.id} initiating conversation with ${otherPlayer.id}.`);
          const messageUuid = crypto.randomUUID();
          setIsTyping(now, conversation, player, messageUuid);
          startOperation(game, now, agent, 'agentGenerateMessage', {
            worldId: game.worldId,
            playerId: player.id,
            agentId: agent.id,
            conversationId: conversation.id,
            otherPlayerId: otherPlayer.id,
            messageUuid,
            type: 'start',
          });
          return;
        } else {
          // Wait on the other player to say something up to the awkward deadline.
          return;
        }
      }
      // See if the conversation has been going on too long and decide to leave.
      const tooLongDeadline = started + MAX_CONVERSATION_DURATION;
      if (tooLongDeadline < now || conversation.numMessages > MAX_CONVERSATION_MESSAGES) {
        console.log(`${player.id} leaving conversation with ${otherPlayer.id}.`);
        const messageUuid = crypto.randomUUID();
        setIsTyping(now, conversation, player, messageUuid);
        startOperation(game, now, agent, 'agentGenerateMessage', {
          worldId: game.worldId,
          playerId: player.id,
          agentId: agent.id,
          conversationId: conversation.id,
          otherPlayerId: otherPlayer.id,
          messageUuid,
          type: 'leave',
        });
        return;
      }
      // Wait for the awkward deadline if we sent the last message.
      if (conversation.lastMessage.author === player.id) {
        const awkwardDeadline = conversation.lastMessage.timestamp + AWKWARD_CONVERSATION_TIMEOUT;
        if (now < awkwardDeadline) {
          return;
        }
      }
      // Wait for a cooldown after the last message to simulate "reading" the message.
      const messageCooldown = conversation.lastMessage.timestamp + MESSAGE_COOLDOWN;
      if (now < messageCooldown) {
        return;
      }
      // Grab the lock and send a message!
      console.log(`${player.id} continuing conversation with ${otherPlayer.id}.`);
      const messageUuid = crypto.randomUUID();
      setIsTyping(now, conversation, player, messageUuid);
      startOperation(game, now, agent, 'agentGenerateMessage', {
        worldId: game.worldId,
        playerId: player.id,
        agentId: agent.id,
        conversationId: conversation.id,
        otherPlayerId: otherPlayer.id,
        messageUuid,
        type: 'continue',
      });
      return;
    }
  }
}

type AgentOperations = {
  agentRememberConversation: typeof internal.aiTown.agentOperations.agentRememberConversation;
  agentGenerateMessage: typeof internal.aiTown.agentOperations.agentGenerateMessage;
  agentDoSomething: typeof internal.aiTown.agentOperations.agentDoSomething;
};

export async function runAgentOperation(ctx: MutationCtx, operation: string, args: any) {
  let reference;
  switch (operation) {
    case 'agentRememberConversation':
      reference = internal.aiTown.agentOperations.agentRememberConversation;
      break;
    case 'agentGenerateMessage':
      reference = internal.aiTown.agentOperations.agentGenerateMessage;
      break;
    case 'agentDoSomething':
      reference = internal.aiTown.agentOperations.agentDoSomething;
      break;
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
  await ctx.scheduler.runAfter(0, reference, args);
}

function startOperation<Name extends keyof AgentOperations>(
  game: Game,
  now: number,
  agent: Agent,
  name: Name,
  args: Omit<FunctionArgs<AgentOperations[Name]>, 'operationId'>,
) {
  if (agent.inProgressOperation) {
    throw new Error(
      `Agent ${agent.id} already has an operation: ${JSON.stringify(agent.inProgressOperation)}`,
    );
  }
  const operationId = crypto.randomUUID();
  console.log(`Agent ${agent.id} starting operation ${name} (${operationId})`);
  game.scheduleOperation(name, { operationId, ...args } as any);
  agent.inProgressOperation = {
    name,
    operationId,
    started: now,
  };
}

export const agentInputs = {
  finishRememberConversation: inputHandler({
    args: {
      operationId: v.string(),
      agentId,
    },
    handler: (game, now, args) => {
      const agentId = parseGameId('agents', args.agentId, game.nextId);
      const agent = game.agents.get(agentId);
      if (!agent) {
        throw new Error(`Couldn't find agent: ${agentId}`);
      }
      if (
        !agent.inProgressOperation ||
        agent.inProgressOperation.operationId !== args.operationId
      ) {
        console.debug(`Agent ${agentId} isn't remembering ${args.operationId}`);
      } else {
        delete agent.inProgressOperation;
        delete agent.toRemember;
      }
      return null;
    },
  }),
  finishDoSomething: inputHandler({
    args: {
      operationId: v.string(),
      agentId: v.id('agents'),
      destination: v.optional(point),
      invitee: v.optional(v.id('players')),
      activity: v.optional(activity),
    },
    handler: (game, now, args) => {
      const agentId = game.parseId('agents', args.agentId);
      const agent = game.agents.get(agentId);
      if (!agent) {
        throw new Error(`Couldn't find agent: ${agentId}`);
      }
      if (
        !agent.inProgressOperation ||
        agent.inProgressOperation.operationId !== args.operationId
      ) {
        console.debug(`Agent ${agentId} didn't have ${args.operationId} in progress`);
        return null;
      }
      delete agent.inProgressOperation;
      const player = game.players.get(agent.playerId)!;
      if (args.invitee) {
        const inviteeId = game.parseId('players', args.invitee);
        const invitee = game.players.get(inviteeId);
        if (!invitee) {
          throw new Error(`Couldn't find player: ${inviteeId}`);
        }
        startConversation(game, now, player, invitee);
        agent.lastInviteAttempt = now;
      }
      if (args.destination) {
        movePlayer(game, now, player, args.destination);
      }
      if (args.activity) {
        player.activity = args.activity;
      }
      return null;
    },
  }),
  agentFinishSendingMessage: inputHandler({
    args: {
      agentId,
      conversationId,
      timestamp: v.number(),
      operationId: v.string(),
      leaveConversation: v.boolean(),
    },
    handler: (game: Game, now: number, args) => {
      const agentId = game.parseId('agents', args.agentId);
      const agent = game.agents.get(agentId);
      if (!agent) {
        throw new Error(`Couldn't find agent: ${agentId}`);
      }
      const player = game.players.get(agent.playerId);
      if (!player) {
        throw new Error(`Couldn't find player: ${agent.playerId}`);
      }
      const conversationId = game.parseId('conversations', args.conversationId);
      const conversation = game.conversations.get(conversationId);
      if (!conversation) {
        throw new Error(`Couldn't find conversation: ${conversationId}`);
      }
      if (
        !agent.inProgressOperation ||
        agent.inProgressOperation.operationId !== args.operationId
      ) {
        console.debug(`Agent ${agentId} wasn't sending a message ${args.operationId}`);
        return null;
      }
      delete agent.inProgressOperation;
      conversationInputs.finishSendingMessage.handler(game, now, {
        playerId: agent.playerId,
        conversationId: args.conversationId,
        timestamp: args.timestamp,
      });
      if (args.leaveConversation) {
        leaveConversation(game, now, player, conversation);
      }
      return null;
    },
  }),
  createAgent: inputHandler({
    args: {
      descriptionIndex: v.number(),
    },
    handler: (game, now, args) => {
      const description = Descriptions[args.descriptionIndex];
      const playerId = joinGame(
        game,
        now,
        description.name,
        description.character,
        description.identity,
      );
      const agentId = game.allocId('agents');
      game.agents.set(agentId, {
        id: agentId,
        playerId: playerId,
      });
      game.agentDescriptions.set(agentId, {
        agentId: agentId,
        identity: description.identity,
        plan: description.plan,
      });
      return { agentId };
    },
  }),
};

export const agentSendMessage = internalMutation({
  args: {
    worldId: v.id('worlds'),
    conversationId,
    agentId,
    playerId,
    text: v.string(),
    messageUuid: v.string(),
    leaveConversation: v.boolean(),
    operationId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('messages', {
      conversationId: args.conversationId,
      author: args.playerId,
      text: args.text,
      messageUuid: args.messageUuid,
    });
    await insertInput(ctx, args.worldId, 'agentFinishSendingMessage', {
      conversationId: args.conversationId,
      agentId: args.agentId,
      timestamp: Date.now(),
      leaveConversation: args.leaveConversation,
      operationId: args.operationId,
    });
  },
});

export const findConversationCandidate = internalQuery({
  args: {
    now: v.number(),
    worldId: v.id('worlds'),
    player,
    otherFreePlayers: v.array(player),
  },
  handler: async (ctx, { now, worldId, player, otherFreePlayers }) => {
    const { position } = player;
    const candidates = [];

    for (const otherPlayer of otherFreePlayers) {
      // Find the latest conversation we're both members of.
      const lastMember = await ctx.db
        .query('participatedTogether')
        .withIndex('edge', (q) =>
          q.eq('worldId', worldId).eq('player1', player.id).eq('player2', otherPlayer.id),
        )
        .order('desc')
        .first();
      if (lastMember) {
        if (now < lastMember.ended + PLAYER_CONVERSATION_COOLDOWN) {
          continue;
        }
      }
      candidates.push({ id: otherPlayer.id, position });
    }

    // Sort by distance and take the nearest candidate.
    candidates.sort((a, b) => distance(a.position, position) - distance(b.position, position));
    return candidates[0]?.id;
  },
});
