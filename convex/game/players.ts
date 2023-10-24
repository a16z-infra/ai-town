import { defineTable } from 'convex/server';
import { Infer, v } from 'convex/values';
import { path, point } from '../util/types';
import { GameTable } from '../engine/gameTable';
import { DatabaseWriter } from '../_generated/server';
import { Doc, Id } from '../_generated/dataModel';
import { AiTown } from './aiTown';
import { blocked } from './movement';
import { characters } from '../../data/characters';
import { stopConversation } from './conversations';

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

export const activity = v.object({
  description: v.string(),
  emoji: v.optional(v.string()),
  until: v.number(),
});
export type Activity = Infer<typeof activity>;

// The players table has game-specific public state, like
// the player's name and position, some internal state,
// like its current pathfinding state, and some engine
// specific state, like a position buffer of the player's
// positions over the last step. Eventually we can pull this
// out into something engine managed.
const playerValidator = {
  worldId: v.id('worlds'),
  // Is the player active?
  active: v.boolean(),

  name: v.string(),
  description: v.string(),
  character: v.string(),

  // If present, it's the auth tokenIdentifier of the owning player.
  human: v.optional(v.string()),

  pathfinding: v.optional(pathfinding),
  activity: v.optional(activity),

  // Pointer to the locations table for the player's current position.
  locationId: v.id('locations'),
};

export const playerDoc = v.object({
  _id: v.id('players'),
  _creationTime: v.number(),
  ...playerValidator,
});

export const players = defineTable(playerValidator).index('active', ['worldId', 'active', 'human']);

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

export async function joinGame(
  game: AiTown,
  now: number,
  name: string,
  character: string,
  description: string,
  tokenIdentifier?: string,
) {
  let position;
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = {
      x: Math.floor(Math.random() * game.map.width),
      y: Math.floor(Math.random() * game.map.height),
    };
    if (blocked(game, now, candidate)) {
      continue;
    }
    position = candidate;
    break;
  }
  if (!position) {
    throw new Error(`Failed to find a free position!`);
  }
  const facingOptions = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];
  const facing = facingOptions[Math.floor(Math.random() * facingOptions.length)];
  if (!characters.find((c) => c.name === character)) {
    throw new Error(`Invalid character: ${character}`);
  }
  const locationId = await game.locations.insert(now, {
    x: position.x,
    y: position.y,
    dx: facing.dx,
    dy: facing.dy,
    velocity: 0,
  });
  const playerId = await game.players.insert({
    worldId: game.world._id,
    name,
    description,
    active: true,
    human: tokenIdentifier,
    character,
    locationId,
  });
  return playerId;
}

export async function leaveGame(game: AiTown, now: number, playerId: Id<'players'>) {
  const player = game.players.lookup(playerId);
  // Stop our conversation if we're leaving the game.
  const membership = game.conversationMembers.find((m) => m.playerId === playerId);
  if (membership) {
    const conversation = game.conversations.find((d) => d._id === membership.conversationId);
    if (conversation === null) {
      throw new Error(`Couldn't find conversation: ${membership.conversationId}`);
    }
    stopConversation(game, now, conversation);
  }
  player.active = false;
}
