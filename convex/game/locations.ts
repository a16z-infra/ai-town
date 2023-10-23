import { v } from 'convex/values';
import { defineTable } from 'convex/server';
import { DatabaseWriter } from '../_generated/server';
import { Players } from './players';
import { Doc, Id } from '../_generated/dataModel';
import { FieldConfig, HistoricalTable } from '../engine/historicalTable';

export const locations = defineTable({
  // Position.
  x: v.number(),
  y: v.number(),

  // Normalized orientation vector.
  dx: v.number(),
  dy: v.number(),

  // Velocity (in tiles/sec).
  velocity: v.number(),

  // History buffer field out by `HistoricalTable`.
  history: v.optional(v.bytes()),
});

export const locationFields: FieldConfig = [
  { name: 'x', precision: 8 },
  { name: 'y', precision: 8 },
  { name: 'dx', precision: 8 },
  { name: 'dy', precision: 8 },
  { name: 'velocity', precision: 16 },
];
export class Locations extends HistoricalTable<'locations'> {
  table = 'locations' as const;

  static async load(
    db: DatabaseWriter,
    engineId: Id<'engines'>,
    players: Players,
  ): Promise<Locations> {
    const rows = [];
    for (const playerId of players.allIds()) {
      const player = players.lookup(playerId);
      const row = await db.get(player.locationId);
      if (!row) {
        throw new Error(`Invalid location ID: ${player.locationId}`);
      }
      rows.push(row);
    }
    return new Locations(db, engineId, rows);
  }

  constructor(
    public db: DatabaseWriter,
    public engineId: Id<'engines'>,
    rows: Doc<'locations'>[],
  ) {
    super(locationFields, rows);
  }
}
