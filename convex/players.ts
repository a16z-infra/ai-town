import { v } from 'convex/values';
import { Doc, Id } from './_generated/dataModel';
import { DatabaseReader, mutation, query } from './_generated/server';
import { enqueueAgentWake } from './engine';
import { HEARTBEAT_PERIOD, WORLD_IDLE_THRESHOLD } from './config';
import { Characters, Player, Pose } from './schema';
import { getPlayer, walkToTarget } from './journal';
import { internal } from './_generated/api';
import { getPoseFromMotion, roundPose } from './lib/physics';
import { Auth } from 'convex/server';

export const activeWorld = async (db: DatabaseReader) => {
  // Future: based on auth, fetch the user's world
  const world = await db.query('worlds').order('desc').first();
  if (!world) {
    console.error('No world found');
    return null;
  }
  return world;
};

export const getWorld = query({
  args: {},
  handler: async (ctx, _args) => {
    const world = await activeWorld(ctx.db);
    if (!world) {
      return null;
    }
    const map = await ctx.db.get(world.mapId);
    if (!map) throw new Error('No map found for world ' + world._id);
    return {
      world,
      map,
      players: await getAllPlayers(ctx.db, world._id),
    };
  },
});

export const now = mutation({
  args: { worldId: v.id('worlds') },
  handler: async (ctx, { worldId }) => {
    // Future: based on auth, heartbeat for that user for presence
    // TODO: make heartbeats world-specific
    const lastHeartbeat = await ctx.db.query('heartbeats').order('desc').first();
    if (!lastHeartbeat || lastHeartbeat._creationTime + HEARTBEAT_PERIOD < Date.now()) {
      // Keep the world ticking.
      await ctx.db.insert('heartbeats', {});
      if (!lastHeartbeat || lastHeartbeat._creationTime + WORLD_IDLE_THRESHOLD < Date.now()) {
        // Start up the world if it's been idle for a while.
        await ctx.scheduler.runAfter(0, internal.engine.tick, { worldId });
      }
    }
    return Date.now();
  },
});

export const characterData = query({
  args: { characterId: v.id('characters') },
  handler: async (ctx, { characterId }) => {
    const character = await ctx.db.get(characterId);
    if (!character) throw new Error('No character found for ' + characterId);
    return character;
  },
});

export const playerState = query({
  args: { playerId: v.id('players') },
  handler: async (ctx, args) => {
    const playerDoc = await ctx.db.get(args.playerId);
    if (!playerDoc) return null;
    const player = await getPlayer(ctx.db, playerDoc);
    return player;
  },
});

export const activePlayerDoc = async (
  auth: Auth,
  db: DatabaseReader,
): Promise<Doc<'players'> | null> => {
  const world = await activeWorld(db);
  if (!world) {
    return null;
  }
  const userIdentity = await auth.getUserIdentity();
  if (!userIdentity) {
    return null;
  }
  const playerDoc = await db
    .query('players')
    .withIndex('by_user', (q) =>
      q.eq('worldId', world._id).eq('controller', userIdentity.tokenIdentifier),
    )
    .first();
  return playerDoc;
};

export const activePlayer = async (auth: Auth, db: DatabaseReader): Promise<Player | null> => {
  const playerDoc = await activePlayerDoc(auth, db);
  if (!playerDoc) return null;
  return getPlayer(db, playerDoc);
};

export const getActivePlayer = query({
  args: {},
  handler: async (ctx, _args) => {
    return activePlayer(ctx.auth, ctx.db);
  },
});

export const waitingToTalk = query({
  args: { conversationId: v.id('conversations') },
  handler: async (ctx, { conversationId }) => {
    const activePlayer = await activePlayerDoc(ctx.auth, ctx.db);
    if (!activePlayer) {
      return false;
    }
    return activePlayer.controllerThinking === conversationId;
  },
});

export const navigateActivePlayer = mutation({
  args: {
    direction: v.union(v.literal('w'), v.literal('a'), v.literal('s'), v.literal('d')),
  },
  handler: async (ctx, { direction }) => {
    const world = await activeWorld(ctx.db);
    const player = await activePlayer(ctx.auth, ctx.db);
    if (!player) {
      return;
    }
    const map = (await ctx.db.get(world!.mapId))!;
    // WARNING: height corresponds to X, width corresponds to Y.
    const maxX = world!.height! - 1;
    const maxY = world!.width! - 1;
    const pose = getPoseFromMotion(player.motion, Date.now());
    const rawPosition = pose.position;
    const currentPosition = roundPose(pose).position;
    const position = { ...currentPosition };
    // If you're less than 50% of the way to the rounded position already, don't move.
    const LEADING_BUFFER = 0.5;
    switch (direction) {
      case 'a':
        if (position.x <= 0) return;
        if (position.x + LEADING_BUFFER < rawPosition.x) return;
        position.x -= 1;
        break;
      case 's':
        if (position.y >= maxY) return;
        if (position.y - LEADING_BUFFER > rawPosition.y) return;
        position.y += 1;
        break;
      case 'w':
        if (position.y <= 0) return;
        if (position.y + LEADING_BUFFER < rawPosition.y) return;
        position.y -= 1;
        break;
      case 'd':
        if (position.x >= maxX) return;
        if (position.x - LEADING_BUFFER > rawPosition.x) return;
        position.x += 1;
        break;
      default:
        break;
    }
    if (map.objectTiles[position.y][position.x] !== -1) {
      console.log('bumped into object');
      return;
    }
    console.log(`walking to x: ${position.x}, y: ${position.y}`);
    await walkToTarget(ctx, player.id, world!._id, [], position);
    await ctx.scheduler.runAfter(0, internal.journal.leaveConversation, {
      playerId: player.id,
    });
  },
});

export const createCharacter = mutation({
  args: {
    name: v.string(),
    spritesheetData: Characters.fields.spritesheetData,
  },
  handler: async (ctx, { name, spritesheetData }) => {
    return await ctx.db.insert('characters', {
      name,
      textureUrl: '/ai-town/assets/32x32folk.png',
      spritesheetData,
      speed: 0.2,
    });
  },
});

export const createPlayer = mutation({
  args: {
    pose: Pose,
    name: v.string(),
    characterId: v.id('characters'),
    forUser: v.optional(v.literal(true)),
  },
  handler: async (ctx, { name, characterId, pose, forUser }) => {
    const world = await activeWorld(ctx.db);
    let controller = undefined;
    if (forUser) {
      const activePlayer = await activePlayerDoc(ctx.auth, ctx.db);
      if (activePlayer) {
        throw new Error('you already have a player');
      }
      const userIdentity = await ctx.auth.getUserIdentity();
      if (!userIdentity) {
        throw new Error('must be logged in to make an interacting player');
      }
      controller = userIdentity.tokenIdentifier;
    }
    // Future: associate this with an authed user
    const playerId = await ctx.db.insert('players', {
      name,
      characterId,
      worldId: world!._id,
      controller,
    });
    await ctx.db.insert('journal', {
      playerId,
      data: { type: 'stopped', reason: 'idle', pose },
    });
    return playerId;
  },
});

export const deletePlayer = mutation({
  args: {},
  handler: async (ctx) => {
    const activePlayer = await activePlayerDoc(ctx.auth, ctx.db);
    if (!activePlayer) {
      throw new Error('no player to delete');
    }
    await ctx.scheduler.runAfter(0, internal.journal.leaveConversation, {
      playerId: activePlayer._id,
    });
    await ctx.db.delete(activePlayer._id);
  },
});

// Future: this could allow creating an agent
export const createAgent = mutation({
  args: {
    pose: Pose,
    name: v.string(),
    worldId: v.id('worlds'),
    characterId: v.id('characters'),
  },
  handler: async (ctx, { name, worldId, characterId, ...args }) => {
    // Future: associate this with an authed user
    const playerId = await ctx.db.insert('players', {
      name,
      characterId,
      worldId,
    });
    const agentId = await ctx.db.insert('agents', {
      playerId,
      scheduled: true,
      thinking: false,
      worldId,
      nextWakeTs: Date.now(),
      lastWakeTs: Date.now(),
    });
    await ctx.db.patch(playerId, { agentId });
    await ctx.db.insert('journal', {
      playerId,
      data: { type: 'stopped', reason: 'idle', pose: args.pose },
    });
    await enqueueAgentWake(ctx, agentId, worldId, Date.now());
    return playerId;
  },
});

export async function getAllPlayers(db: DatabaseReader, worldId: Id<'worlds'>) {
  return await db
    .query('players')
    .withIndex('by_worldId', (q) => q.eq('worldId', worldId))
    .collect();
}
