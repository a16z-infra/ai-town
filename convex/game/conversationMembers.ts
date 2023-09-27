import { defineTable } from 'convex/server';
import { v } from 'convex/values';
import { GameTable } from '../engine/gameTable';
import { DatabaseWriter } from '../_generated/server';
import { Doc, Id } from '../_generated/dataModel';
import { Conversations } from './conversations';

// Invariants:
// A player is in at most one conversation.
// At most two players are in one conversation.
// Two players in a conversation are close together if they're both participating.
export const conversationMembers = defineTable({
  conversationId: v.id('conversations'),
  playerId: v.id('players'),
  status: v.union(
    v.object({ kind: v.literal('invited') }),
    v.object({ kind: v.literal('walkingOver') }),
    v.object({ kind: v.literal('participating'), since: v.number() }),
    v.object({ kind: v.literal('left'), when: v.number() }),
  ),
})
  .index('conversationId', ['conversationId', 'playerId'])
  .index('playerId', ['playerId', 'status.kind']);

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
