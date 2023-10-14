import { DatabaseReader } from '../_generated/server';
import { Doc, Id } from '../_generated/dataModel';
import { CONVERSATION_DISTANCE, TYPING_TIMEOUT } from '../constants';
import { MIDPOINT_THRESHOLD } from './constants';
import {
  AWKWARD_CONVERSATION_TIMEOUT,
  CONVERSATION_COOLDOWN,
  INPUT_TIMEOUT,
  INVITE_ACCEPT_PROBABILITY,
  INVITE_TIMEOUT,
  MAX_CONVERSATION_DURATION,
  MAX_CONVERSATION_MESSAGES,
  MESSAGE_COOLDOWN,
  PLAYER_CONVERSATION_COOLDOWN,
} from './constants';
import { Point } from '../util/types';
import { conversationMember } from '../game/conversationMembers';
import { distance } from '../util/geometry';
import { latestMemoryOfType } from './memory';

export type ReadyInput = {
  inputId: Id<'inputs'>;
  name: string;
  returnValue: { kind: 'ok'; value: any } | { kind: 'error'; message: string };
};

export type ConversationDecision =
  | { kind: 'noLongerParticipating' }
  | { kind: 'waitForTypingIndicator'; deadline: number }
  | { kind: 'sendMessage'; messageKind: 'start' | 'continue' | 'finish' }
  | { kind: 'waitForMessage'; deadline: number }
  | { kind: 'waitForCooldown'; deadline: number };

export type AgentDecision =
  | { kind: 'waitOnInputs'; deadline: number }
  | { kind: 'completeInputs'; inputs: ReadyInput[] }
  | { kind: 'moveTo'; destination: Point }
  | { kind: 'rememberConversation'; conversationId: Id<'conversations'> }
  | { kind: 'conversationCooldown'; deadline: number }
  | { kind: 'waitForPartnerRetry'; deadline: number }
  | { kind: 'sendInvite'; playerId: Id<'players'> }
  | { kind: 'acceptInvite'; conversationId: Id<'conversations'> }
  | { kind: 'rejectInvite'; conversationId: Id<'conversations'> }
  | { kind: 'leaveConversation'; conversationId: Id<'conversations'> }
  | { kind: 'waitForInviteTimeout'; deadline: number }
  | {
      kind: 'participateInConversation';
      conversationId: Id<'conversations'>;
      otherPlayerId: Id<'players'>;
      lastConversationId: Id<'conversations'> | null;
      conversationDecision: ConversationDecision;
    };

export async function agentDecision(
  db: DatabaseReader,
  now: number,
  agent: Doc<'agents'>,
): Promise<AgentDecision> {
  // Collect inputs that have completed so the agent can observe
  // their results and remove them from the in-progress list.
  const { readyInputs, waitingInputs } = await collectInputs(db, agent);
  if (waitingInputs.length > 0) {
    const deadline = waitingInputs
      .map((input) => input.submitted + INPUT_TIMEOUT)
      .reduce((a, b) => Math.min(a, b));
    return {
      kind: 'waitOnInputs',
      deadline,
    };
  }
  if (readyInputs.length > 0) {
    return {
      kind: 'completeInputs',
      inputs: readyInputs,
    };
  }

  const player = await db.get(agent.playerId);
  if (!player) {
    throw new Error(`Player ${agent.playerId} not found`);
  }
  const location = await db.get(player.locationId);
  if (!location) {
    throw new Error(`Location ${player.locationId} not found`);
  }
  const position = { x: location.x, y: location.y };

  // Check if the agent has a conversation it should remember.
  const toRemember = await conversationToRemember(db, agent.playerId);
  if (toRemember) {
    // If we aren't walking around yet, do that first.
    if (!player.pathfinding) {
      const destination = await wanderDestination(db, agent);
      return {
        kind: 'moveTo',
        destination,
      };
    }
    // Otherwise, start remembering the conversation.
    return {
      kind: 'rememberConversation',
      conversationId: toRemember,
    };
  }
  const playerConversation = await loadConversationState(db, agent.playerId);

  // If we're not in a conversation, make sure we're walking around and try to find a
  // new conversation partner.
  if (!playerConversation) {
    if (!player.pathfinding) {
      const destination = await wanderDestination(db, agent);
      return {
        kind: 'moveTo',
        destination,
      };
    }
    const lastConversationEnded = await queryLastConversationEnded(db, agent.playerId);
    if (lastConversationEnded && now < lastConversationEnded + CONVERSATION_COOLDOWN) {
      return {
        kind: 'conversationCooldown',
        deadline: lastConversationEnded + CONVERSATION_COOLDOWN,
      };
    }
    const partner = await findConversationPartner(db, now, player);
    if (partner.kind === 'ok') {
      return {
        kind: 'sendInvite',
        playerId: partner.candidate._id,
      };
    } else {
      const deadline =
        partner.kind === 'tooEarly' ? partner.nextAttempt : now + PLAYER_CONVERSATION_COOLDOWN;
      return {
        kind: 'waitForPartnerRetry',
        deadline,
      };
    }
  }

  // Otherwise, we're in a conversation.
  else {
    const member = playerConversation.member;
    const otherPlayer = await db.get(playerConversation.otherPlayerId);
    if (!otherPlayer) {
      throw new Error(`Player ${playerConversation.otherPlayerId} not found`);
    }
    const otherLocation = await db.get(otherPlayer.locationId);
    if (!otherLocation) {
      throw new Error(`Location ${otherPlayer.locationId} not found`);
    }
    const otherPosition = { x: otherLocation.x, y: otherLocation.y };

    switch (member.status.kind) {
      case 'invited': {
        // Accept a conversation with another agent with some probability and with
        // a human unconditionally.
        const acceptInvite = otherPlayer.human || Math.random() < INVITE_ACCEPT_PROBABILITY;
        const kind = acceptInvite ? 'acceptInvite' : 'rejectInvite';
        return {
          kind,
          conversationId: playerConversation._id,
        };
      }
      case 'walkingOver': {
        // Leave a conversation if we've been waiting for too long.
        const deadline = member._creationTime + INVITE_TIMEOUT;
        if (deadline < now) {
          return {
            kind: 'leaveConversation',
            conversationId: playerConversation._id,
          };
        }

        const playerDistance = distance(position, otherPosition);
        const destination = partnerDestination(position, otherPosition);

        // Don't keep moving around if we're near enough.
        if (!player.pathfinding && playerDistance > CONVERSATION_DISTANCE) {
          return {
            kind: 'moveTo',
            destination,
          };
        }
        // Reset our destination if it's too far away from the desired one.
        if (
          player.pathfinding &&
          distance(player.pathfinding.destination, destination) > MIDPOINT_THRESHOLD
        ) {
          return {
            kind: 'moveTo',
            destination,
          };
        }

        return {
          kind: 'waitForInviteTimeout',
          deadline,
        };
      }
      case 'participating': {
        const lastMember = await db
          .query('conversationMembers')
          .withIndex('left', (q) =>
            q
              .eq('playerId', player._id)
              .eq('status.kind', 'left')
              .eq('status.with', otherPlayer._id),
          )
          .order('desc')
          .first();
        return {
          kind: 'participateInConversation',
          conversationId: playerConversation._id,
          otherPlayerId: otherPlayer._id,
          lastConversationId: lastMember?.conversationId ?? null,
          conversationDecision: await conversationDecision(
            db,
            now,
            agent._id,
            playerConversation._id,
          ),
        };
      }
      default: {
        throw new Error(`Unexpected member status: ${member.status.kind}`);
      }
    }
  }
}

async function conversationDecision(
  db: DatabaseReader,
  now: number,
  agentId: Id<'agents'>,
  conversationId: Id<'conversations'>,
): Promise<ConversationDecision> {
  const agent = await db.get(agentId);
  if (!agent) {
    throw new Error(`Invalid agent ID: ${agentId}`);
  }
  const conversation = await db.get(conversationId);
  if (!conversation) {
    throw new Error(`Invalid conversation ID: ${conversationId}`);
  }
  const member = await db
    .query('conversationMembers')
    .withIndex('conversationId', (q) =>
      q.eq('conversationId', conversationId).eq('playerId', agent.playerId),
    )
    .unique();
  if (!member || member.status.kind !== 'participating') {
    return { kind: 'noLongerParticipating' };
  }
  const indicator = await db
    .query('typingIndicator')
    .withIndex('conversationId', (q) => q.eq('conversationId', conversationId))
    .first();
  if (indicator?.typing && indicator.typing.playerId !== agent.playerId) {
    return { kind: 'waitForTypingIndicator', deadline: indicator.typing.since + TYPING_TIMEOUT };
  }
  const messages = await db
    .query('messages')
    .withIndex('conversationId', (q) => q.eq('conversationId', conversationId))
    .collect();
  const lastMessage = messages.at(-1);

  if (!lastMessage) {
    const initiator = conversation.creator === agent.playerId;
    const awkwardDeadline = member.status.started + AWKWARD_CONVERSATION_TIMEOUT;
    if (initiator || awkwardDeadline < now) {
      return { kind: 'sendMessage', messageKind: 'start' };
    } else {
      return { kind: 'waitForMessage', deadline: awkwardDeadline };
    }
  }

  if (
    member.status.started + MAX_CONVERSATION_DURATION < now ||
    messages.length >= MAX_CONVERSATION_MESSAGES
  ) {
    return { kind: 'sendMessage', messageKind: 'finish' };
  }

  // Wait for the awkward deadline if we sent the last message.
  if (lastMessage.author === agent.playerId) {
    const awkwardDeadline = lastMessage._creationTime + AWKWARD_CONVERSATION_TIMEOUT;
    if (now < awkwardDeadline) {
      return { kind: 'waitForMessage', deadline: awkwardDeadline };
    }
  }

  const cooldownDeadline = lastMessage._creationTime + MESSAGE_COOLDOWN;
  if (now < cooldownDeadline) {
    return { kind: 'waitForCooldown', deadline: cooldownDeadline };
  }

  return { kind: 'sendMessage', messageKind: 'continue' };
}

async function collectInputs(db: DatabaseReader, agent: Doc<'agents'>) {
  const readyInputs = [];
  const waitingInputs = [];
  if (agent.inProgressInputs.length > 0) {
    for (const { inputId, submitted } of agent.inProgressInputs) {
      const input = await db.get(inputId);
      if (!input) {
        throw new Error(`Input ${inputId} not found`);
      }
      if (input.returnValue) {
        readyInputs.push({ inputId, name: input.name, returnValue: input.returnValue });
      } else {
        waitingInputs.push({ inputId, submitted });
      }
    }
  }
  return { readyInputs, waitingInputs };
}

async function conversationToRemember(db: DatabaseReader, playerId: Id<'players'>) {
  // Walk our left conversations in decreasing creation time order, skipping
  // conversations that don't have any messages.
  const leftConversations = db
    .query('conversationMembers')
    .withIndex('playerId', (q) => q.eq('playerId', playerId).eq('status.kind', 'left'))
    .order('desc');
  let conversationId;
  for await (const member of leftConversations) {
    // Skip conversations that don't have any messages.
    const firstMessage = await db
      .query('messages')
      .withIndex('conversationId', (q) => q.eq('conversationId', member.conversationId))
      .first();
    if (!firstMessage) {
      continue;
    }
    const memory = await latestMemoryOfType(db, playerId, 'conversation');
    // If the most recent memory is not for this conversation, remember it.
    // We assume we've remembered previous conversations.
    if (memory?.data.conversationId !== member.conversationId) {
      conversationId = member.conversationId;
    }
    break;
  }
  return conversationId ?? null;
}

async function wanderDestination(db: DatabaseReader, agent: Doc<'agents'>) {
  const world = await db.get(agent.worldId);
  if (!world) {
    throw new Error(`World ${agent.worldId} not found`);
  }
  const map = await db.get(world.mapId);
  if (!map) {
    throw new Error(`Map ${world.mapId} not found`);
  }
  // Wander someonewhere at least one tile away from the edge.
  return {
    x: 1 + Math.floor(Math.random() * (map.width - 2)),
    y: 1 + Math.floor(Math.random() * (map.height - 2)),
  };
}

async function loadConversationState(db: DatabaseReader, playerId: Id<'players'>) {
  const player = await db.get(playerId);
  if (!player) {
    throw new Error(`Invalid player ID: ${playerId}`);
  }
  const member = await conversationMember(db, player._id);
  if (!member) {
    return null;
  }
  const conversation = await db.get(member.conversationId);
  if (!conversation) {
    throw new Error(`Invalid conversation ID: ${member.conversationId}`);
  }

  const members = await db
    .query('conversationMembers')
    .withIndex('conversationId', (q) => q.eq('conversationId', conversation._id))
    .collect();
  const otherMember = members.find((m) => m.playerId !== player._id);
  if (!otherMember) {
    throw new Error(`Conversation ${conversation._id} has no other member`);
  }
  const otherPlayerId = otherMember.playerId;

  return { member, otherPlayerId, ...conversation };
}

async function queryLastConversationEnded(db: DatabaseReader, playerId: Id<'players'>) {
  const lastConversationMember = await db
    .query('conversationMembers')
    .withIndex('left', (q) => q.eq('playerId', playerId).eq('status.kind', 'left'))
    .order('desc')
    .first();
  let playerLastConversation: number | null = null;
  if (lastConversationMember) {
    if (lastConversationMember.status.kind !== 'left') {
      throw new Error(`Conversation ${lastConversationMember.conversationId} is not left`);
    }
    playerLastConversation = lastConversationMember.status.ended;
  }
  return playerLastConversation;
}

async function findConversationPartner(db: DatabaseReader, now: number, player: Doc<'players'>) {
  const location = await db.get(player.locationId);
  if (!location) {
    throw new Error(`Couldn't find location: ${player.locationId}`);
  }
  const position = { x: location.x, y: location.y };
  const otherPlayers = await db
    .query('players')
    .withIndex('active', (q) => q.eq('worldId', player.worldId).eq('active', true))
    .filter((q) => q.neq(q.field('_id'), player._id))
    .collect();

  const candidates = [];

  let nextAttempt: number | null = null;

  for (const otherPlayer of otherPlayers) {
    // Skip players that are currently in a conversation.
    const member = await conversationMember(db, otherPlayer._id);
    if (member) {
      continue;
    }
    // Find the latest conversation we're both members of.
    const lastMember = await db
      .query('conversationMembers')
      .withIndex('left', (q) =>
        q.eq('playerId', player._id).eq('status.kind', 'left').eq('status.with', otherPlayer._id),
      )
      .order('desc')
      .first();

    if (lastMember) {
      if (lastMember.status.kind !== 'left') {
        throw new Error(`Unexpected status: ${lastMember.status.kind}`);
      }
      const earliestAttempt = lastMember.status.ended + PLAYER_CONVERSATION_COOLDOWN;
      if (now < earliestAttempt) {
        nextAttempt = Math.min(nextAttempt ?? earliestAttempt, earliestAttempt);
        continue;
      }
    }
    const location = await db.get(otherPlayer.locationId);
    if (!location) {
      throw new Error(`Couldn't find location: ${otherPlayer.locationId}`);
    }
    const position = { x: location.x, y: location.y };
    candidates.push({ _id: otherPlayer._id, position });
  }

  // Sort by distance and take the nearest candidate.
  candidates.sort((a, b) => distance(a.position, position) - distance(b.position, position));

  if (candidates.length > 0) {
    return { kind: 'ok' as const, candidate: candidates[0] };
  } else if (nextAttempt) {
    return { kind: 'tooEarly' as const, nextAttempt };
  } else {
    return { kind: 'nobody' as const };
  }
}
function partnerDestination(position: Point, otherPosition: Point) {
  if (distance(position, otherPosition) < MIDPOINT_THRESHOLD) {
    return {
      x: Math.floor(otherPosition.x),
      y: Math.floor(otherPosition.y),
    };
  } else {
    return {
      x: Math.floor((position.x + otherPosition.x) / 2),
      y: Math.floor((position.y + otherPosition.y) / 2),
    };
  }
}
