import { defineTable } from 'convex/server';
import { v } from 'convex/values';
import { GameTable } from '../engine/gameTable';
import { DatabaseWriter } from '../_generated/server';
import { Doc, Id } from '../_generated/dataModel';

export const conversations = defineTable({
  worldId: v.id('worlds'),
  creator: v.id('players'),
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
