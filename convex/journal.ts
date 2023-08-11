import { v } from 'convex/values';
import { Doc, Id } from './_generated/dataModel';
import { DatabaseReader, internalMutation, internalQuery } from './_generated/server';
import {
  Position,
  EntryOfType,
  EntryType,
  Player,
  MessageEntry,
  MemoryOfType,
  MemoryType,
} from './schema';
import { asyncMap, pruneNull } from './lib/utils';
import { getAllPlayers } from './players';
import { CLOSE_DISTANCE, DEFAULT_START_POSE, STUCK_CHILL_TIME, TIME_PER_STEP } from './config';
import { findCollision, findRoute } from './lib/routing';
import {
  getNearbyPlayers,
  getPoseFromMotion,
  getRemainingPathFromMotion,
  getRouteDistance,
  roundPose,
} from './lib/physics';
import { clientMessageMapper } from './chat';

/**
 * Reading state about the world
 */

export const getSnapshot = internalQuery({
  args: { playerIds: v.array(v.id('players')) },
  handler: async (ctx, args) => {
    const playerDocs = pruneNull(await asyncMap(args.playerIds, ctx.db.get));
    return {
      players: await asyncMap(playerDocs, (playerDoc) => getPlayer(ctx.db, playerDoc)),
    };
  },
});

export async function getPlayer(db: DatabaseReader, playerDoc: Doc<'players'>): Promise<Player> {
  const agentDoc = playerDoc.agentId ? await db.get(playerDoc.agentId) : null;
  const latestConversation = await getLatestPlayerConversation(db, playerDoc._id);
  const identityEntry = await latestMemoryOfType(db, playerDoc._id, 'identity');
  const identity = identityEntry?.description ?? 'I am a person.';
  const planEntry = await latestMemoryOfType(db, playerDoc._id, 'plan');

  return {
    id: playerDoc._id,
    name: playerDoc.name,
    agentId: playerDoc.agentId,
    characterId: playerDoc.characterId,
    identity,
    motion: await getLatestPlayerMotion(db, playerDoc._id),
    thinking: agentDoc?.thinking ?? false,
    lastPlan: planEntry ? { plan: planEntry.description, ts: planEntry._creationTime } : undefined,
    lastChat: latestConversation && {
      message: await clientMessageMapper(db)(latestConversation),
      conversationId: latestConversation.data.conversationId,
    },
  };
}

async function getLatestPlayerConversation(db: DatabaseReader, playerId: Id<'players'>) {
  const lastChat = await latestEntryOfType(db, playerId, 'talking');
  const lastStartChat = await latestEntryOfType(db, playerId, 'startConversation');
  const lastLeaveChat = await latestEntryOfType(db, playerId, 'leaveConversation');
  return pruneNull([lastChat, lastStartChat, lastLeaveChat])
    .sort((a, b) => a._creationTime - b._creationTime)
    .pop();
}

export async function getLatestPlayerMotion(db: DatabaseReader, playerId: Id<'players'>) {
  const lastStop = await latestEntryOfType(db, playerId, 'stopped');
  const lastWalk = await latestEntryOfType(db, playerId, 'walking');
  const latestMotion = pruneNull([lastStop, lastWalk])
    .sort((a, b) => a._creationTime - b._creationTime)
    .pop()?.data;
  return latestMotion ?? { type: 'stopped', reason: 'idle', pose: DEFAULT_START_POSE };
}

export async function latestEntryOfType<T extends EntryType>(
  db: DatabaseReader,
  playerId: Id<'players'>,
  type: T,
) {
  const entry = await db
    .query('journal')
    .withIndex('by_playerId_type', (q) => q.eq('playerId', playerId).eq('data.type', type))
    .order('desc')
    .first();
  if (!entry) return null;
  return entry as EntryOfType<T>;
}

export const getRelationships = internalQuery({
  args: { playerIds: v.array(v.id('players')) },
  handler: async (ctx, args) => {
    return asyncMap(args.playerIds, async (playerId) => {
      const otherPlayerIds = args.playerIds.filter((id) => id !== playerId);
      return {
        playerId,
        relations: await asyncMap(otherPlayerIds, async (otherPlayerId) => {
          const relationship = await latestRelationshipMemoryWith(ctx.db, playerId, otherPlayerId);
          return {
            id: otherPlayerId,
            relationship: relationship?.description ?? 'unknown',
          };
        }),
      };
    });
  },
});

async function latestRelationshipMemoryWith(
  db: DatabaseReader,
  playerId: Id<'players'>,
  otherPlayerId: Id<'players'>,
) {
  const entry = await db
    .query('memories')
    .withIndex('by_playerId_type', (q) =>
      q.eq('playerId', playerId).eq('data.type', 'relationship'),
    )
    .order('desc')
    .filter((q) => q.eq(q.field('data.playerId'), otherPlayerId))
    .first();
  if (!entry) return null;
  return entry as MemoryOfType<'relationship'>;
}

export async function latestMemoryOfType<T extends MemoryType>(
  db: DatabaseReader,
  playerId: Id<'players'>,
  type: T,
) {
  const entry = await db
    .query('memories')
    .withIndex('by_playerId_type', (q) => q.eq('playerId', playerId).eq('data.type', type))
    .order('desc')
    .first();
  if (!entry) return null;
  return entry as MemoryOfType<T>;
}

/**
 * Changing the state of the world
 */

export const makeConversation = internalMutation({
  args: { playerId: v.id('players'), audience: v.array(v.id('players')) },
  handler: async (ctx, { playerId, audience, ...args }) => {
    const playerDoc = (await ctx.db.get(playerId))!;
    const { worldId } = playerDoc;
    const conversationId = await ctx.db.insert('conversations', { worldId });
    await ctx.db.insert('journal', {
      playerId,
      data: {
        type: 'startConversation',
        audience,
        conversationId,
      },
    });
    return conversationId;
  },
});

export const talk = internalMutation({
  args: {
    playerId: v.id('players'),
    audience: v.array(v.id('players')),
    conversationId: v.id('conversations'),
    content: v.string(),
    relatedMemoryIds: v.array(v.id('memories')),
  },
  handler: async (ctx, { playerId, ...args }) => {
    if (args.audience.length === 0) {
      console.debug("Didn't talk: no audience");
      return null;
    }
    const entryId = await ctx.db.insert('journal', {
      playerId,
      data: { type: 'talking', ...args },
    });
    return await clientMessageMapper(ctx.db)((await ctx.db.get(entryId))! as MessageEntry);
  },
});

export const leaveConversation = internalMutation({
  args: {
    playerId: v.id('players'),
    audience: v.array(v.id('players')),
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, { playerId, audience, conversationId, ...args }) => {
    await ctx.db.insert('journal', {
      playerId,
      data: { type: 'leaveConversation', audience, conversationId },
    });
  },
});

export const stop = internalMutation({
  args: {
    playerId: v.id('players'),
  },
  handler: async (ctx, { playerId }) => {
    const motion = await getLatestPlayerMotion(ctx.db, playerId);
    await ctx.db.insert('journal', {
      playerId,
      data: {
        type: 'stopped',
        reason: 'interrupted',
        // Future: maybe model stopping as a path of length 1 or 2 instead of
        // its own type. Then we can continue along the existing path instead of
        // snapping to the final location.
        // A path of length 2 could start in the past to make it smooth.
        pose: roundPose(getPoseFromMotion(motion, Date.now())),
      },
    });
  },
});

export const walk = internalMutation({
  args: {
    agentId: v.id('agents'),
    ignore: v.array(v.id('players')),
    // Future: allow specifying a specific place to go, ideally a named Zone.
    target: v.optional(v.id('players')),
  },
  handler: async (ctx, { agentId, ignore, target }) => {
    const ts = Date.now();
    const agentDoc = (await ctx.db.get(agentId))!;
    const { playerId, worldId } = agentDoc;
    const world = (await ctx.db.get(worldId))!;
    const map = (await ctx.db.get(world.mapId))!;
    const otherPlayers = await asyncMap(
      (await getAllPlayers(ctx.db, worldId)).filter((p) => p._id !== playerId),
      async (p) => ({
        ...p,
        motion: await getLatestPlayerMotion(ctx.db, p._id),
      }),
    );
    const targetPosition = target
      ? getPoseFromMotion(await getLatestPlayerMotion(ctx.db, target), ts).position
      : getRandomPosition(map);
    const ourMotion = await getLatestPlayerMotion(ctx.db, playerId);
    const { route, distance } = findRoute(
      map,
      ourMotion,
      otherPlayers.map(({ motion }) => motion),
      targetPosition,
      ts,
    );
    if (distance === 0) {
      if (ourMotion.type === 'walking') {
        await ctx.db.insert('journal', {
          playerId,
          data: {
            type: 'stopped',
            pose: { position: route[0], orientation: 270 },
            reason: 'interrupted',
          },
        });
      }
      return {
        targetEndTs: ts + STUCK_CHILL_TIME,
        // TODO: detect collisions with other players running into us.
      };
    }
    const exclude = new Set([...ignore, playerId]);
    const targetEndTs = ts + distance * TIME_PER_STEP;
    const collisions = findCollision(
      route,
      otherPlayers.filter((p) => !exclude.has(p._id)),
      ts,
      CLOSE_DISTANCE,
    );
    await ctx.db.insert('journal', {
      playerId,
      data: { type: 'walking', route, ignore, startTs: ts, targetEndTs },
    });
    return {
      targetEndTs,
      nextCollision: collisions && {
        ts: collisions.distance * TIME_PER_STEP + ts,
        agentIds: pruneNull(collisions.hits.map(({ agentId }) => agentId)),
      },
    };
  },
});

export const nextCollision = internalQuery({
  args: { agentId: v.id('agents'), ignore: v.array(v.id('players')) },
  handler: async (ctx, { agentId, ignore, ...args }) => {
    const ts = Date.now();
    const agentDoc = (await ctx.db.get(agentId))!;
    const { playerId, worldId } = agentDoc;
    const exclude = new Set([...ignore, playerId]);
    const otherPlayers = await asyncMap(
      (await getAllPlayers(ctx.db, worldId)).filter((p) => !exclude.has(p._id)),
      async (p) => ({ ...p, motion: await getLatestPlayerMotion(ctx.db, p._id) }),
    );
    const ourMotion = await getLatestPlayerMotion(ctx.db, playerId);
    const nearby = getNearbyPlayers(ourMotion, otherPlayers);
    nearby.forEach(({ _id: id }) => exclude.add(id));
    const othersNotNearby = otherPlayers.filter(({ _id }) => !exclude.has(_id));
    const route = getRemainingPathFromMotion(ourMotion, ts);
    const distance = getRouteDistance(route);
    const targetEndTs = ts + distance * TIME_PER_STEP;
    const collisions = findCollision(route, othersNotNearby, ts, CLOSE_DISTANCE);
    return {
      targetEndTs,
      nextCollision: collisions && {
        ts: collisions.distance * TIME_PER_STEP + ts,
        agentIds: pruneNull(collisions.hits.map(({ agentId }) => agentId)),
      },
    };
  },
});

export function getRandomPosition(map: Doc<'maps'>): Position {
  let pos;
  do
    pos = {
      x: Math.floor(Math.random() * map.bgTiles[0][0].length),
      y: Math.floor(Math.random() * map.bgTiles[0].length),
    };
  while (map.objectTiles[pos.y][pos.x] !== -1);
  return pos;
}
