import { defineTable } from 'convex/server';
import { v } from 'convex/values';
import { GameTable } from '../engine/gameTable';
import { DatabaseWriter } from '../_generated/server';
import { Doc, Id } from '../_generated/dataModel';
import { AiTown } from './aiTown';

export const conversations = defineTable({
  worldId: v.id('worlds'),
  creator: v.id('players'),
  isTyping: v.optional(
    v.object({
      playerId: v.id('players'),
      messageUuid: v.string(),
      since: v.number(),
    }),
  ),
  lastMessage: v.optional(
    v.object({
      author: v.id('players'),
      timestamp: v.number(),
    }),
  ),
  numMessages: v.number(),
  finished: v.optional(v.number()),
}).index('worldId', ['worldId', 'finished']);

export class Conversations extends GameTable<'conversations'> {
  table = 'conversations' as const;

  static async load(db: DatabaseWriter, worldId: Id<'worlds'>): Promise<Conversations> {
    const rows = await db
      .query('conversations')
      .withIndex('worldId', (q) => q.eq('worldId', worldId).eq('finished', undefined))
      .collect();
    return new Conversations(db, worldId, rows);
  }

  constructor(
    public db: DatabaseWriter,
    public worldId: Id<'worlds'>,
    rows: Doc<'conversations'>[],
  ) {
    super(rows);
  }

  isActive(doc: Doc<'conversations'>): boolean {
    return doc.finished === undefined;
  }
}

export function setIsTyping(
  game: AiTown,
  now: number,
  conversationId: Id<'conversations'>,
  playerId: Id<'players'>,
  messageUuid: string,
) {
  const conversation = game.conversations.lookup(conversationId);
  if (!conversation) {
    throw new Error(`Invalid conversation ID: ${conversationId}`);
  }
  if (conversation.finished) {
    throw new Error(`Conversation is finished: ${conversationId}`);
  }
  if (conversation.isTyping) {
    if (conversation.isTyping.playerId !== playerId) {
      throw new Error(
        `Player ${conversation.isTyping.playerId} is already typing in ${conversationId}`,
      );
    }
    return;
  }
  conversation.isTyping = { playerId, messageUuid, since: now };
}

export async function startConversation(
  game: AiTown,
  playerId: Id<'players'>,
  invitee: Id<'players'>,
) {
  if (playerId === invitee) {
    throw new Error(`Can't invite yourself to a conversation`);
  }
  const player = game.players.lookup(playerId);
  const inviteePlayer = game.players.lookup(invitee);
  if (game.conversationMembers.find((m) => m.playerId === playerId)) {
    const reason = `Player ${playerId} is already in a conversation`;
    console.log(reason);
    return { error: reason };
  }
  if (game.conversationMembers.find((m) => m.playerId === invitee)) {
    const reason = `Player ${playerId} is already in a conversation`;
    console.log(reason);
    return { error: reason };
  }
  const conversationId = await game.conversations.insert({
    creator: playerId,
    worldId: game.world._id,
    numMessages: 0,
  });
  console.log(`Creating conversation ${conversationId}`);
  await game.conversationMembers.insert({
    conversationId,
    playerId,
    status: { kind: 'walkingOver' },
  });
  await game.conversationMembers.insert({
    conversationId,
    playerId: invitee,
    status: { kind: 'invited' },
  });
  return { conversationId };
}

export function stopConversation(game: AiTown, now: number, conversation: Doc<'conversations'>) {
  conversation.finished = now;
  delete conversation.isTyping;
  const members = game.conversationMembers.filter((m) => m.conversationId === conversation._id);
  if (members.length !== 2) {
    throw new Error(`Conversation ${conversation._id} has ${members.length} members`);
  }
  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    const otherMember = members[(i + 1) % 2];
    const started = member.status.kind === 'participating' ? member.status.started : undefined;
    member.status = { kind: 'left', started, ended: now, with: otherMember.playerId };

    const agent = game.agents.find((a) => a.playerId === member.playerId);
    if (agent) {
      agent.lastConversation = now;
      agent.toRemember = conversation._id;
    }
  }
}
