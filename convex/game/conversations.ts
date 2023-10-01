import { defineTable } from 'convex/server';
import { v } from 'convex/values';
import { GameTable } from '../engine/gameTable';
import { DatabaseWriter } from '../_generated/server';
import { Doc, Id } from '../_generated/dataModel';

export const conversations = defineTable({
  engineId: v.id('engines'),
  creator: v.id('players'),
  finished: v.optional(v.number()),
}).index('engineId', ['engineId', 'finished']);

export class Conversations extends GameTable<'conversations'> {
  table = 'conversations' as const;

  static async load(db: DatabaseWriter, engineId: Id<'engines'>): Promise<Conversations> {
    const rows = await db
      .query('conversations')
      .withIndex('engineId', (q) => q.eq('engineId', engineId).eq('finished', undefined))
      .collect();
    return new Conversations(db, engineId, rows);
  }

  constructor(
    public db: DatabaseWriter,
    public engineId: Id<'engines'>,
    rows: Doc<'conversations'>[],
  ) {
    super(rows);
  }

  isActive(doc: Doc<'conversations'>): boolean {
    return doc.finished === undefined;
  }
}
