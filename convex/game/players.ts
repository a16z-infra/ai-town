import { defineTable } from 'convex/server';
import { Infer, v } from 'convex/values';
import { path, point } from '../util/types';
import { GameTable } from '../engine/gameTable';
import { DatabaseWriter } from '../_generated/server';
import { Doc, Id } from '../_generated/dataModel';

const pathfinding = v.object({
  destination: point,
  started: v.number(),
  state: v.union(
    v.object({
      kind: v.literal('needsPath'),
    }),
    v.object({
      kind: v.literal('waiting'),
      until: v.number(),
    }),
    v.object({
      kind: v.literal('moving'),
      path,
    }),
  ),
});
export type Pathfinding = Infer<typeof pathfinding>;

// The players table has game-specific public state, like
// the player's name and position, some internal state,
// like its current pathfinding state, and some engine
// specific state, like a position buffer of the player's
// positions over the last step. Eventually we can pull this
// out into something engine managed.
export const players = defineTable({
  worldId: v.id('worlds'),
  // Is the player active?
  active: v.boolean(),

  name: v.string(),
  description: v.string(),
  character: v.string(),

  // If present, it's the auth tokenIdentifier of the owning player.
  human: v.optional(v.string()),

  pathfinding: v.optional(pathfinding),

  // Pointer to the locations table for the player's current position.
  locationId: v.id('locations'),
}).index('active', ['worldId', 'active', 'human']);

export class Players extends GameTable<'players'> {
  table = 'players' as const;

  static async load(db: DatabaseWriter, worldId: Id<'worlds'>): Promise<Players> {
    const rows = await db
      .query('players')
      .withIndex('active', (q) => q.eq('worldId', worldId).eq('active', true))
      .collect();
    return new Players(db, worldId, rows);
  }

  constructor(
    public db: DatabaseWriter,
    public worldId: Id<'worlds'>,
    rows: Doc<'players'>[],
  ) {
    super(rows);
  }

  isActive(doc: Doc<'players'>): boolean {
    return doc.active;
  }
}
