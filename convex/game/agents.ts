import { FunctionArgs, FunctionReference, defineTable, getFunctionName } from 'convex/server';
import { v } from 'convex/values';
import { GameTable } from '../engine/gameTable';
import { DatabaseWriter, internalAction, internalMutation } from '../_generated/server';
import { Doc, Id } from '../_generated/dataModel';
import { Players } from './players';
import { AiTown } from './aiTown';
import { distance } from '../util/geometry';
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
import { movePlayer } from './movement';
import {
  acceptInvite,
  conversationMember,
  leaveConversation,
  rejectInvite,
} from './conversationMembers';
import { setIsTyping } from './conversations';
import { api, internal } from '../_generated/api';
import { rememberConversation } from '../agent/memory';
import { insertInput } from './main';
import {
  continueConversationMessage,
  leaveConversationMessage,
  startConversationMessage,
} from '../agent/conversation';
import { assertNever } from '../util/assertNever';

const selfInternal = internal.game.agents;

export const agents = defineTable({
  worldId: v.id('worlds'),
  playerId: v.id('players'),

  identity: v.string(),
  plan: v.string(),

  toRemember: v.optional(v.id('conversations')),
  lastConversation: v.optional(v.number()),
  lastInviteAttempt: v.optional(v.number()),
  conversationCandidate: v.optional(v.id('players')),

  inProgressOperation: v.optional(
    v.object({
      name: v.string(),
      uuid: v.string(),
      started: v.number(),
    }),
  ),
}).index('playerId', ['playerId']);

export class Agents extends GameTable<'agents'> {
  table = 'agents' as const;

  static async load(db: DatabaseWriter, players: Players): Promise<Agents> {
    const rows = [];
    for (const player of players.allDocuments()) {
      const agent = await db
        .query('agents')
        .withIndex('playerId', (q) => q.eq('playerId', player._id))
        .unique();
      if (!agent) {
        continue;
      }
      rows.push(agent);
    }
    return new Agents(db, rows);
  }

  constructor(
    public db: DatabaseWriter,
    rows: Doc<'agents'>[],
  ) {
    super(rows);
  }

  isActive(_doc: Doc<'agents'>): boolean {
    return true;
  }
}

export function tickAgent(game: AiTown, now: number, agent: Doc<'agents'>) {
  const player = game.players.lookup(agent.playerId);
  const location = game.locations.lookup(now, player.locationId);
  const position = { x: location.x, y: location.y };

  if (agent.inProgressOperation) {
    if (now < agent.inProgressOperation.started + ACTION_TIMEOUT) {
      // Wait on the operation to finish.
      return;
    }
    console.log(`Timing out ${JSON.stringify(agent.inProgressOperation)}`);
    delete agent.inProgressOperation;
  }

  const member = game.conversationMembers.find((m) => m.playerId === player._id);

  // Check to see if we have a conversation we need to remember.
  const toRemember: null | Id<'conversations'> = null;
  if (toRemember) {
    // Pick a random destination.
    if (!player.pathfinding && !member) {
      movePlayer(game, now, player._id, wanderDestination(game));
    }
    // Fire off the action to remember the conversation.
    console.log(`Agent ${player.name} remembering conversation ${toRemember}`);
    startOperation(game, now, agent, selfInternal.agentRememberConversation, {
      worldId: agent.worldId,
      playerId: player._id,
      agentId: agent._id,
      conversationId: toRemember,
    });
    return;
  }

  // If we're not in a conversation, wander around to somewhere to start one.
  if (!member) {
    if (!player.pathfinding) {
      movePlayer(game, now, player._id, wanderDestination(game));
    }

    // Don't try to start a new conversation if we were just in one.
    if (agent.lastConversation && now < agent.lastConversation + CONVERSATION_COOLDOWN) {
      return;
    }

    // Don't try again if we recently tried to find someone to invite.
    if (agent.lastInviteAttempt && now < agent.lastInviteAttempt + CONVERSATION_COOLDOWN) {
      return;
    }

    // Validate our conversation candidate if we have one saved.
    if (agent.conversationCandidate) {
      const otherMember = game.conversationMembers.find(
        (m) => m.playerId === agent.conversationCandidate,
      );
      if (otherMember) {
        delete agent.conversationCandidate;
      }
    }
    // If we don't have a conversation candidate, fire off an action to find one.
    if (!agent.conversationCandidate) {
      agent.lastInviteAttempt = now;
      startOperation(game, now, agent, selfInternal.agentFindConversation, {
        worldId: agent.worldId,
        playerId: player._id,
        agentId: agent._id,
      });
      return;
    }

    const invitee = agent.conversationCandidate;

    delete agent.conversationCandidate;
    agent.lastInviteAttempt = now;

    startOperation(game, now, agent, selfInternal.agentSendInvite, {
      worldId: agent.worldId,
      agentId: agent._id,
      invitee,
    });
    return;
  }
  if (member) {
    const conversation = game.conversations.find((d) => d._id === member.conversationId);
    if (conversation === null) {
      throw new Error(`Couldn't find conversation: ${member.conversationId}`);
    }
    const otherMember = game.conversationMembers.find(
      (m) => m.conversationId === conversation._id && m.playerId !== player._id,
    );
    if (!otherMember) {
      throw new Error(`Couldn't find other player in conversation: ${conversation._id}`);
    }
    const otherPlayer = game.players.lookup(otherMember.playerId);
    const otherLocation = game.locations.lookup(now, otherPlayer.locationId);
    const otherPosition = { x: otherLocation.x, y: otherLocation.y };

    if (member.status.kind === 'invited') {
      // Accept a conversation with another agent with some probability and with
      // a human unconditionally.
      if (otherPlayer.human || Math.random() < INVITE_ACCEPT_PROBABILITY) {
        console.log(`Agent ${player.name} accepting invite from ${otherPlayer.name}`);
        acceptInvite(game, player._id, conversation._id);
        // Stop moving so we can start walking towards the other player.
        if (player.pathfinding) {
          delete player.pathfinding;
        }
      } else {
        console.log(`Agent ${player.name} rejecting invite from ${otherPlayer.name}`);
        rejectInvite(game, now, player._id, conversation._id);
      }
      return;
    }
    if (member.status.kind === 'walkingOver') {
      // Leave a conversation if we've been waiting for too long.
      if (member._creationTime + INVITE_TIMEOUT < now) {
        console.log(`Giving up on invite to ${otherPlayer.name}`);
        leaveConversation(game, now, player._id, conversation._id);
        return;
      }

      // Don't keep moving around if we're near enough.
      const playerDistance = distance(position, otherPosition);
      if (playerDistance < CONVERSATION_DISTANCE) {
        return;
      }

      // Keep moving towards the other player.
      // If we're close enough to the player, just walk to them directly.
      if (!player.pathfinding) {
        let destination;
        if (playerDistance < MIDPOINT_THRESHOLD) {
          destination = {
            x: Math.floor(otherPosition.x),
            y: Math.floor(otherPosition.y),
          };
        } else {
          destination = {
            x: Math.floor((position.x + otherPosition.x) / 2),
            y: Math.floor((position.y + otherPosition.y) / 2),
          };
        }
        console.log(`Agent ${player.name} walking towards ${otherPlayer.name}...`, destination);
        movePlayer(game, now, player._id, destination);
      }
      return;
    }
    if (member.status.kind === 'participating') {
      const started = member.status.started;

      if (conversation.isTyping && conversation.isTyping.playerId !== player._id) {
        // Wait for the other player to finish typing.
        return;
      }

      if (!conversation.lastMessage) {
        const isInitiator = conversation.creator === player._id;
        const awkwardDeadline = started + AWKWARD_CONVERSATION_TIMEOUT;
        // Send the first message if we're the initiator or if we've been waiting for too long.
        if (isInitiator || awkwardDeadline < now) {
          // Grab the lock on the conversation and send a "start" message.
          console.log(`${player.name} initiating conversation with ${otherPlayer.name}.`);
          const messageUuid = crypto.randomUUID();
          setIsTyping(game, now, conversation._id, player._id, messageUuid);
          startOperation(game, now, agent, selfInternal.agentGenerateMessage, {
            worldId: agent.worldId,
            agentId: agent._id,
            playerId: player._id,
            messageUuid,
            otherPlayerId: otherPlayer._id,
            conversationId: conversation._id,
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
        console.log(`${player.name} leaving conversation with ${otherPlayer.name}.`);
        const messageUuid = crypto.randomUUID();
        setIsTyping(game, now, conversation._id, player._id, messageUuid);
        startOperation(game, now, agent, selfInternal.agentGenerateMessage, {
          worldId: agent.worldId,
          agentId: agent._id,
          playerId: player._id,
          messageUuid,
          otherPlayerId: otherPlayer._id,
          conversationId: conversation._id,
          type: 'leave',
        });
        return;
      }

      // Wait for the awkward deadline if we sent the last message.
      if (conversation.lastMessage.author === player._id) {
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
      console.log(`${player.name} continuing conversation with ${otherPlayer.name}.`);
      const messageUuid = crypto.randomUUID();
      setIsTyping(game, now, conversation._id, player._id, messageUuid);
      startOperation(game, now, agent, selfInternal.agentGenerateMessage, {
        worldId: agent.worldId,
        agentId: agent._id,
        playerId: player._id,
        messageUuid,
        otherPlayerId: otherPlayer._id,
        conversationId: conversation._id,
        type: 'continue',
      });
      return;
    }
  }
}

function startOperation<F extends FunctionReference<any, any, any>>(
  game: AiTown,
  now: number,
  agent: Doc<'agents'>,
  ref: F,
  args: Omit<FunctionArgs<F>, 'uuid'>,
) {
  if (agent.inProgressOperation) {
    throw new Error(
      `Agent ${agent._id} already has an operation: ${JSON.stringify(agent.inProgressOperation)}`,
    );
  }
  const uuid = crypto.randomUUID();
  console.log(`Agent ${agent._id} starting operation ${getFunctionName(ref)} (${uuid})`);
  game.withScheduler((scheduler) => scheduler.runAfter(0, ref, { uuid, ...args } as any));
  agent.inProgressOperation = {
    name: getFunctionName(ref),
    uuid,
    started: now,
  };
}

function wanderDestination(game: AiTown) {
  // Wander someonewhere at least one tile away from the edge.
  return {
    x: 1 + Math.floor(Math.random() * (game.map.width - 2)),
    y: 1 + Math.floor(Math.random() * (game.map.height - 2)),
  };
}

export const agentRememberConversation = internalAction({
  args: {
    worldId: v.id('worlds'),
    playerId: v.id('players'),
    agentId: v.id('agents'),
    conversationId: v.id('conversations'),
    uuid: v.string(),
  },
  handler: async (ctx, args) => {
    await rememberConversation(ctx, args.agentId, args.playerId, args.conversationId);
    await ctx.runMutation(api.game.main.sendInput, {
      worldId: args.worldId,
      name: 'finishRememberConversation',
      args: {
        agentId: args.agentId,
        uuid: args.uuid,
      },
    });
  },
});

export const agentFindConversation = internalMutation({
  args: {
    worldId: v.id('worlds'),
    playerId: v.id('players'),
    agentId: v.id('agents'),
    uuid: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error(`Couldn't find player: ${args.playerId}`);
    }
    const location = await ctx.db.get(player.locationId);
    if (!location) {
      throw new Error(`Couldn't find location: ${player.locationId}`);
    }
    const position = { x: location.x, y: location.y };

    const otherPlayers = await ctx.db
      .query('players')
      .withIndex('active', (q) => q.eq('worldId', args.worldId).eq('active', true))
      .filter((q) => q.neq(q.field('_id'), args.playerId))
      .collect();

    const candidates = [];

    for (const otherPlayer of otherPlayers) {
      // Skip players that are currently in a conversation.
      const member = await conversationMember(ctx.db, otherPlayer._id);
      if (member) {
        continue;
      }
      // Find the latest conversation we're both members of.
      const lastMember = await ctx.db
        .query('conversationMembers')
        .withIndex('left', (q) =>
          q
            .eq('playerId', args.playerId)
            .eq('status.kind', 'left')
            .eq('status.with', otherPlayer._id),
        )
        .order('desc')
        .first();

      if (lastMember) {
        if (lastMember.status.kind !== 'left') {
          throw new Error(`Unexpected status: ${lastMember.status.kind}`);
        }
        if (now < lastMember.status.ended + PLAYER_CONVERSATION_COOLDOWN) {
          continue;
        }
      }
      const location = await ctx.db.get(otherPlayer.locationId);
      if (!location) {
        throw new Error(`Couldn't find location: ${otherPlayer.locationId}`);
      }
      const position = { x: location.x, y: location.y };
      candidates.push({ _id: otherPlayer._id, position });
    }

    // Sort by distance and take the nearest candidate.
    candidates.sort((a, b) => distance(a.position, position) - distance(b.position, position));
    const candidate = candidates.length > 0 ? candidates[0]._id : null;

    await insertInput(ctx, args.worldId, 'finishFindConversation', {
      uuid: args.uuid,
      agentId: args.agentId,
      candidate: candidate,
    });
  },
});

export const agentSendInvite = internalMutation({
  args: {
    worldId: v.id('worlds'),
    agentId: v.id('agents'),
    invitee: v.id('players'),
    uuid: v.string(),
  },
  handler: async (ctx, args) => {
    await insertInput(ctx, args.worldId, 'agentStartConversation', {
      agentId: args.agentId,
      invitee: args.invitee,
      uuid: args.uuid,
    });
  },
});

export const agentGenerateMessage = internalAction({
  args: {
    worldId: v.id('worlds'),
    conversationId: v.id('conversations'),
    agentId: v.id('agents'),
    playerId: v.id('players'),
    otherPlayerId: v.id('players'),

    type: v.union(v.literal('start'), v.literal('continue'), v.literal('leave')),
    messageUuid: v.string(),
    uuid: v.string(),
  },
  handler: async (ctx, args) => {
    let completionFn;
    switch (args.type) {
      case 'start':
        completionFn = startConversationMessage;
        break;
      case 'continue':
        completionFn = continueConversationMessage;
        break;
      case 'leave':
        completionFn = leaveConversationMessage;
        break;
      default:
        assertNever(args.type);
    }
    const completion = await completionFn(
      ctx,
      args.conversationId,
      args.playerId,
      args.otherPlayerId,
    );
    const text = await completion.readAll();
    await ctx.runMutation(selfInternal.agentSendMessage, {
      worldId: args.worldId,
      conversationId: args.conversationId,
      agentId: args.agentId,
      messageUuid: args.messageUuid,
      text,
      leaveConversation: args.type === 'leave',
      uuid: args.uuid,
    });
  },
});

export const agentSendMessage = internalMutation({
  args: {
    worldId: v.id('worlds'),
    conversationId: v.id('conversations'),
    agentId: v.id('agents'),
    text: v.string(),
    messageUuid: v.string(),
    leaveConversation: v.boolean(),
    uuid: v.string(),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      throw new Error(`Couldn't find agent: ${args.agentId}`);
    }
    await ctx.db.insert('messages', {
      conversationId: args.conversationId,
      author: agent.playerId,
      text: args.text,
      messageUuid: args.messageUuid,
    });
    await insertInput(ctx, args.worldId, 'agentFinishSendingMessage', {
      conversationId: args.conversationId,
      agentId: args.agentId,
      timestamp: Date.now(),
      leaveConversation: args.leaveConversation,
      uuid: args.uuid,
    });
  },
});
