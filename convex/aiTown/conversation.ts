import { Infer, v } from 'convex/values';
import { GameId, parseGameId } from './ids';
import { conversationId, playerId } from './ids';
import { Player } from './player';
import { inputHandler } from './inputHandler';

import { TYPING_TIMEOUT, CONVERSATION_DISTANCE } from '../constants';
import { distance, normalize, vector } from '../util/geometry';
import { Point } from '../util/types';
import { Game } from './game';
import { stopPlayer, blocked, movePlayer } from './movement';

const conversationMembership = v.object({
  invited: v.number(),
  status: v.union(
    v.object({ kind: v.literal('invited') }),
    v.object({ kind: v.literal('walkingOver') }),
    v.object({ kind: v.literal('participating'), started: v.number() }),
  ),
});
export type ConversationMembership = Infer<typeof conversationMembership>;

export const conversationFields = {
  id: conversationId,
  creator: playerId,
  created: v.number(),
  isTyping: v.optional(
    v.object({
      playerId,
      messageUuid: v.string(),
      since: v.number(),
    }),
  ),
  lastMessage: v.optional(
    v.object({
      author: playerId,
      timestamp: v.number(),
    }),
  ),
  numMessages: v.number(),
  participants: v.record(playerId, conversationMembership),
};
export const conversation = v.object(conversationFields);
export type ConversationDoc = Infer<typeof conversation>;

export type Conversation = {
  id: GameId<'conversations'>;
  created: number;
  creator: GameId<'players'>;
  isTyping?: {
    playerId: GameId<'players'>;
    messageUuid: string;
    since: number;
  };
  lastMessage?: {
    author: GameId<'players'>;
    timestamp: number;
  };
  numMessages: number;
  participants: Map<GameId<'players'>, ConversationMembership>;
};

function parseConversation(
  players: Map<GameId<'players'>, Player>,
  conversation: ConversationDoc,
  nextId: number,
): Conversation {
  const participants: Map<GameId<'players'>, ConversationMembership> = new Map();
  for (const [playerId, membership] of Object.entries(conversation.participants)) {
    const id = parseGameId('players', playerId, nextId);
    if (!players.has(id)) {
      throw new Error(`Invalid player ID ${id}`);
    }
    participants.set(id, membership);
  }
  let isTyping;
  if (conversation.isTyping) {
    const { messageUuid, since } = conversation.isTyping;
    const playerId = parseGameId('players', conversation.isTyping.playerId, nextId);
    if (!players.has(playerId)) {
      throw new Error(`Invalid player ID ${playerId}`);
    }
    isTyping = {
      playerId,
      messageUuid,
      since,
    };
  }
  let lastMessage;
  if (conversation.lastMessage) {
    const { author, timestamp } = conversation.lastMessage;
    const playerId = parseGameId('players', author, nextId);
    if (!players.has(playerId)) {
      throw new Error(`Invalid player ID ${playerId}`);
    }
    lastMessage = {
      author: playerId,
      timestamp,
    };
  }
  return {
    id: parseGameId('conversations', conversation.id, nextId),
    created: conversation.created,
    creator: parseGameId('players', conversation.creator, nextId),
    isTyping,
    lastMessage,
    numMessages: conversation.numMessages,
    participants,
  };
}

export function parseConversations(
  players: Map<GameId<'players'>, Player>,
  conversations: ConversationDoc[],
  nextId: number,
): Map<GameId<'conversations'>, Conversation> {
  const result: Map<GameId<'conversations'>, Conversation> = new Map();
  for (const conversation of conversations) {
    const parsed = parseConversation(players, conversation, nextId);
    if (result.has(parsed.id)) {
      throw new Error(`Duplicate conversation ID: ${parsed.id}`);
    }
    result.set(parsed.id, parsed);
  }
  return result;
}

export function tickConversation(game: Game, now: number, conversation: Conversation) {
  if (conversation.isTyping && conversation.isTyping.since + TYPING_TIMEOUT < now) {
    delete conversation.isTyping;
  }
  if (conversation.participants.size !== 2) {
    console.warn(
      `Conversation ${conversation.id} has ${conversation.participants.size} participants`,
    );
    return;
  }
  const [playerId1, playerId2] = [...conversation.participants.keys()];
  const member1 = conversation.participants.get(playerId1)!;
  const member2 = conversation.participants.get(playerId2)!;

  const player1 = game.players.get(playerId1)!;
  const player2 = game.players.get(playerId2)!;

  const playerDistance = distance(player1?.position, player2?.position);

  // If the players are both in the "walkingOver" state and they're sufficiently close, transition both
  // of them to "participating" and stop their paths.
  if (member1.status.kind === 'walkingOver' && member2.status.kind === 'walkingOver') {
    if (playerDistance < CONVERSATION_DISTANCE) {
      console.log(`Starting conversation between ${player1.id} and ${player2.id}`);

      // First, stop the two players from moving.
      stopPlayer(player1);
      stopPlayer(player2);

      member1.status = { kind: 'participating', started: now };
      member2.status = { kind: 'participating', started: now };

      // Try to move the first player to grid point nearest the other player.
      const neighbors = (p: Point) => [
        { x: p.x + 1, y: p.y },
        { x: p.x - 1, y: p.y },
        { x: p.x, y: p.y + 1 },
        { x: p.x, y: p.y - 1 },
      ];
      const floorPos1 = { x: Math.floor(player1.position.x), y: Math.floor(player1.position.y) };
      const p1Candidates = neighbors(floorPos1).filter((p) => !blocked(game, now, p, player1.id));
      p1Candidates.sort((a, b) => distance(a, player2.position) - distance(b, player2.position));
      if (p1Candidates.length > 0) {
        const p1Candidate = p1Candidates[0];

        // Try to move the second player to the grid point nearest the first player's
        // destination.
        const p2Candidates = neighbors(p1Candidate).filter(
          (p) => !blocked(game, now, p, player2.id),
        );
        p2Candidates.sort((a, b) => distance(a, player2.position) - distance(b, player2.position));
        if (p2Candidates.length > 0) {
          const p2Candidate = p2Candidates[0];
          movePlayer(game, now, player1, p1Candidate, true);
          movePlayer(game, now, player2, p2Candidate, true);
        }
      }
    }
  }

  // Orient the two players towards each other if they're not moving.
  if (member1.status.kind === 'participating' && member2.status.kind === 'participating') {
    const v = normalize(vector(player1.position, player2.position));
    if (!player1.pathfinding && v) {
      player1.facing = v;
    }
    if (!player2.pathfinding && v) {
      player2.facing.dx = -v.dx;
      player2.facing.dy = -v.dy;
    }
  }
}

export function setIsTyping(
  now: number,
  conversation: Conversation,
  player: Player,
  messageUuid: string,
) {
  if (conversation.isTyping) {
    if (conversation.isTyping.playerId !== player.id) {
      throw new Error(
        `Player ${conversation.isTyping.playerId} is already typing in ${conversationId}`,
      );
    }
    return;
  }
  conversation.isTyping = { playerId: player.id, messageUuid, since: now };
}

export function startConversation(game: Game, now: number, player: Player, invitee: Player) {
  if (player.id === invitee.id) {
    throw new Error(`Can't invite yourself to a conversation`);
  }
  // Ensure the players still exist.
  if ([...game.conversations.values()].find((c) => c.participants.has(player.id))) {
    const reason = `Player ${playerId} is already in a conversation`;
    console.log(reason);
    return { error: reason };
  }
  if ([...game.conversations.values()].find((c) => c.participants.has(invitee.id))) {
    const reason = `Player ${playerId} is already in a conversation`;
    console.log(reason);
    return { error: reason };
  }
  const conversationId = game.allocId('conversations');
  console.log(`Creating conversation ${conversationId}`);
  game.conversations.set(conversationId, {
    id: conversationId,
    created: now,
    creator: player.id,
    numMessages: 0,
    participants: new Map([
      [player.id, { invited: now, status: { kind: 'walkingOver' } }],
      [invitee.id, { invited: now, status: { kind: 'invited' } }],
    ]),
  });
  return { conversationId };
}

export function stopConversation(game: Game, now: number, conversation: Conversation) {
  delete conversation.isTyping;
  for (const [playerId, member] of conversation.participants.entries()) {
    const agent = [...game.agents.values()].find((a) => a.playerId === playerId);
    if (agent) {
      agent.lastConversation = now;
      agent.toRemember = conversation.id;
    }
  }
  game.conversations.delete(conversation.id);
}

export function acceptInvite(game: Game, player: Player, conversation: Conversation) {
  const member = conversation.participants.get(player.id);
  if (!member) {
    throw new Error(`Player ${player.id} not in conversation ${conversation.id}`);
  }
  if (member.status.kind !== 'invited') {
    throw new Error(
      `Invalid membership status for ${player.id}:${conversation.id}: ${JSON.stringify(member)}`,
    );
  }
  member.status = { kind: 'walkingOver' };
}

export function rejectInvite(game: Game, now: number, player: Player, conversation: Conversation) {
  const member = conversation.participants.get(player.id);
  if (!member) {
    throw new Error(`Player ${player.id} not in conversation ${conversation.id}`);
  }
  if (member.status.kind !== 'invited') {
    throw new Error(
      `Rejecting invite in wrong membership state: ${conversation.id}:${
        player.id
      }: ${JSON.stringify(member)}`,
    );
  }
  stopConversation(game, now, conversation);
}

export function leaveConversation(
  game: Game,
  now: number,
  player: Player,
  conversation: Conversation,
) {
  const member = conversation.participants.get(player.id);
  if (!member) {
    throw new Error(`Couldn't find membership for ${conversationId}:${playerId}`);
  }
  stopConversation(game, now, conversation);
}

export const conversationInputs = {
  // Start a conversation, inviting the specified player.
  // Conversations can only have two participants for now,
  // so we don't have a separate "invite" input.
  startConversation: inputHandler({
    args: {
      playerId,
      invitee: playerId,
    },
    handler: (game: Game, now: number, args): GameId<'conversations'> => {
      const playerId = game.parseId('players', args.playerId);
      const player = game.players.get(playerId);
      if (!player) {
        throw new Error(`Invalid player ID: ${playerId}`);
      }
      const inviteeId = game.parseId('players', args.invitee);
      const invitee = game.players.get(inviteeId);
      if (!invitee) {
        throw new Error(`Invalid player ID: ${inviteeId}`);
      }
      console.log(`Starting ${playerId} ${inviteeId}...`);
      const { conversationId, error } = startConversation(game, now, player, invitee);
      if (!conversationId) {
        // TODO: pass it back to the client for them to show an error.
        throw new Error(error);
      }
      return conversationId;
    },
  }),

  startTyping: inputHandler({
    args: {
      playerId,
      conversationId,
      messageUuid: v.string(),
    },
    handler: (game: Game, now: number, args): null => {
      const playerId = game.parseId('players', args.playerId);
      const player = game.players.get(playerId);
      if (!player) {
        throw new Error(`Invalid player ID: ${playerId}`);
      }
      const conversationId = game.parseId('conversations', args.conversationId);
      const conversation = game.conversations.get(conversationId);
      if (!conversation) {
        throw new Error(`Invalid conversation ID: ${conversationId}`);
      }
      if (conversation.isTyping && conversation.isTyping.playerId !== playerId) {
        throw new Error(
          `Player ${conversation.isTyping.playerId} is already typing in ${conversationId}`,
        );
      }
      conversation.isTyping = { playerId, messageUuid: args.messageUuid, since: now };
      return null;
    },
  }),

  finishSendingMessage: inputHandler({
    args: {
      playerId,
      conversationId,
      timestamp: v.number(),
    },
    handler: (game: Game, now: number, args): null => {
      const playerId = game.parseId('players', args.playerId);
      const conversationId = game.parseId('conversations', args.conversationId);
      const conversation = game.conversations.get(conversationId);
      if (!conversation) {
        throw new Error(`Invalid conversation ID: ${conversationId}`);
      }
      if (conversation.isTyping && conversation.isTyping.playerId === playerId) {
        delete conversation.isTyping;
      }
      conversation.lastMessage = { author: playerId, timestamp: args.timestamp };
      conversation.numMessages++;
      return null;
    },
  }),

  // Accept an invite to a conversation, which puts the
  // player in the "walkingOver" state until they're close
  // enough to the other participant.
  acceptInvite: inputHandler({
    args: {
      playerId,
      conversationId,
    },
    handler: (game: Game, now: number, args): null => {
      const playerId = game.parseId('players', args.playerId);
      const player = game.players.get(playerId);
      if (!player) {
        throw new Error(`Invalid player ID ${playerId}`);
      }
      const conversationId = game.parseId('conversations', args.conversationId);
      const conversation = game.conversations.get(conversationId);
      if (!conversation) {
        throw new Error(`Invalid conversation ID ${conversationId}`);
      }
      acceptInvite(game, player, conversation);
      return null;
    },
  }),

  // Reject the invite. Eventually we might add a message
  // that explains why!
  rejectInvite: inputHandler({
    args: {
      playerId,
      conversationId,
    },
    handler: (game: Game, now: number, args): null => {
      const playerId = game.parseId('players', args.playerId);
      const player = game.players.get(playerId);
      if (!player) {
        throw new Error(`Invalid player ID ${playerId}`);
      }
      const conversationId = game.parseId('conversations', args.conversationId);
      const conversation = game.conversations.get(conversationId);
      if (!conversation) {
        throw new Error(`Invalid conversation ID ${conversationId}`);
      }
      rejectInvite(game, now, player, conversation);
      return null;
    },
  }),
  // Leave a conversation.
  leaveConversation: inputHandler({
    args: {
      playerId,
      conversationId,
    },
    handler: (game: Game, now: number, args): null => {
      const playerId = game.parseId('players', args.playerId);
      const player = game.players.get(playerId);
      if (!player) {
        throw new Error(`Invalid player ID ${playerId}`);
      }
      const conversationId = game.parseId('conversations', args.conversationId);
      const conversation = game.conversations.get(conversationId);
      if (!conversation) {
        throw new Error(`Invalid conversation ID ${conversationId}`);
      }
      leaveConversation(game, now, player, conversation);
      return null;
    },
  }),
};
