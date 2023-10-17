import { defineTable } from 'convex/server';
import { v } from 'convex/values';
import { GameTable } from '../engine/gameTable';
import { DatabaseReader, DatabaseWriter } from '../_generated/server';
import { Doc, Id } from '../_generated/dataModel';
import { Conversations, stopConversation } from './conversations';
import { AiTown } from './aiTown';
import { inputHandler } from './inputs';

export const conversationMembers = defineTable({
  conversationId: v.id('conversations'),
  playerId: v.id('players'),
  status: v.union(
    v.object({ kind: v.literal('invited') }),
    v.object({ kind: v.literal('walkingOver') }),
    v.object({ kind: v.literal('participating'), started: v.number() }),
    v.object({
      kind: v.literal('left'),
      started: v.optional(v.number()),
      ended: v.number(),
      // TODO: remove this, and stop doing a targeted lookup of the last convo
      // with another player - we're only using it to prompt when our last
      // conversation with a player ended.
      with: v.id('players'),
    }),
  ),
})
  .index('conversationId', ['conversationId', 'playerId'])
  .index('playerId', ['playerId', 'status.kind', 'status.ended'])
  .index('left', ['playerId', 'status.kind', 'status.with', 'status.ended']);

export class ConversationMembers extends GameTable<'conversationMembers'> {
  table = 'conversationMembers' as const;

  static async load(
    db: DatabaseWriter,
    engineId: Id<'engines'>,
    conversations: Conversations,
  ): Promise<ConversationMembers> {
    const rows = [];
    for (const conversation of conversations.allDocuments()) {
      const conversationRows = await db
        .query('conversationMembers')
        .withIndex('conversationId', (q) => q.eq('conversationId', conversation._id))
        .filter((q) => q.neq(q.field('status.kind'), 'left'))
        .collect();
      rows.push(...conversationRows);
    }
    return new ConversationMembers(db, engineId, rows);
  }

  constructor(
    public db: DatabaseWriter,
    public engineId: Id<'engines'>,
    rows: Doc<'conversationMembers'>[],
  ) {
    super(rows);
  }

  isActive(doc: Doc<'conversationMembers'>): boolean {
    return doc.status.kind !== 'left';
  }
}

export async function conversationMember(db: DatabaseReader, playerId: Id<'players'>) {
  // TODO: We could combine these queries if we had `.neq()` in our index query API.
  const invited = await db
    .query('conversationMembers')
    .withIndex('playerId', (q) => q.eq('playerId', playerId).eq('status.kind', 'invited'))
    .unique();
  const walkingOver = await db
    .query('conversationMembers')
    .withIndex('playerId', (q) => q.eq('playerId', playerId).eq('status.kind', 'walkingOver'))
    .unique();
  const participating = await db
    .query('conversationMembers')
    .withIndex('playerId', (q) => q.eq('playerId', playerId).eq('status.kind', 'participating'))
    .unique();

  if ([invited, walkingOver, participating].filter(Boolean).length > 1) {
    throw new Error(`Player ${playerId} is in multiple conversations`);
  }
  return invited ?? walkingOver ?? participating;
}

export function acceptInvite(
  game: AiTown,
  playerId: Id<'players'>,
  conversationId: Id<'conversations'>,
) {
  const membership = game.conversationMembers.find((m) => m.playerId === playerId);
  if (!membership) {
    throw new Error(`Couldn't find invite for ${playerId}:${conversationId}`);
  }
  if (membership.status.kind !== 'invited') {
    throw new Error(
      `Invalid membership status for ${playerId}:${conversationId}: ${JSON.stringify(membership)}`,
    );
  }
  membership.status = { kind: 'walkingOver' };
}

export function rejectInvite(
  game: AiTown,
  now: number,
  playerId: Id<'players'>,
  conversationId: Id<'conversations'>,
) {
  const conversation = game.conversations.find((d) => d._id === conversationId);
  if (conversation === null) {
    throw new Error(`Couldn't find conversation: ${conversationId}`);
  }
  const membership = game.conversationMembers.find(
    (m) => m.conversationId == conversationId && m.playerId === playerId,
  );
  if (!membership) {
    throw new Error(`Couldn't find membership for ${conversationId}:${playerId}`);
  }
  if (membership.status.kind !== 'invited') {
    throw new Error(
      `Rejecting invite in wrong membership state: ${conversationId}:${playerId}: ${JSON.stringify(
        membership,
      )}`,
    );
  }
  stopConversation(game, now, conversation);
}

export function leaveConversation(
  game: AiTown,
  now: number,
  playerId: Id<'players'>,
  conversationId: Id<'conversations'>,
) {
  const conversation = game.conversations.find((d) => d._id === conversationId);
  if (conversation === null) {
    throw new Error(`Couldn't find conversation: ${conversationId}`);
  }
  const membership = game.conversationMembers.find(
    (m) => m.conversationId === conversationId && m.playerId === playerId,
  );
  if (!membership) {
    throw new Error(`Couldn't find membership for ${conversationId}:${playerId}`);
  }
  stopConversation(game, now, conversation);
}

export const conversationMembersInputs = {
  // Accept an invite to a conversation, which puts the
  // player in the "walkingOver" state until they're close
  // enough to the other participant.
  acceptInvite: inputHandler({
    args: {
      playerId: v.id('players'),
      conversationId: v.id('conversations'),
    },
    handler: async (game: AiTown, now: number, { playerId, conversationId }): Promise<null> => {
      acceptInvite(game, playerId, conversationId);
      return null;
    },
  }),
  // Reject the invite. Eventually we might add a message
  // that explains why!
  rejectInvite: inputHandler({
    args: {
      playerId: v.id('players'),
      conversationId: v.id('conversations'),
    },
    handler: async (game: AiTown, now: number, { playerId, conversationId }): Promise<null> => {
      rejectInvite(game, now, playerId, conversationId);
      return null;
    },
  }),
  // Leave a conversation.
  leaveConversation: inputHandler({
    args: {
      playerId: v.id('players'),
      conversationId: v.id('conversations'),
    },
    handler: async (game: AiTown, now: number, { playerId, conversationId }): Promise<null> => {
      leaveConversation(game, now, playerId, conversationId);
      return null;
    },
  }),
};
