import { v } from 'convex/values';
import { Doc, Id } from './_generated/dataModel';
import {
  DatabaseReader,
  MutationCtx,
  action,
  internalMutation,
  internalQuery,
  mutation,
} from './_generated/server';
import { Position, EntryOfType, EntryType, MessageEntry, MemoryOfType, MemoryType } from './schema';
import { asyncMap, pruneNull } from './lib/utils';
import { activePlayerDoc, getAllPlayers } from './players';
import { CLOSE_DISTANCE, DEFAULT_START_POSE, STUCK_CHILL_TIME, TIME_PER_STEP } from './config';
import { findCollision, findRoute } from './lib/routing';
import {
  calculateOrientation,
  getNearbyPlayers,
  getPoseFromMotion,
  getRemainingPathFromMotion,
  getRouteDistance,
  manhattanDistance,
  roundPose,
} from './lib/physics';
import { clientMessageMapper, conversationQuery } from './chat';
import { internal } from './_generated/api';
import { fetchModeration } from './lib/openai';

/**
 * Reading state about the world
 */

export const getSnapshot = internalQuery({
  args: { playerIds: v.array(v.id('players')) },
  handler: async (ctx, args) => {
    const playerDocs = pruneNull(await asyncMap(args.playerIds, (id) => ctx.db.get(id)));
    return {
      players: await asyncMap(playerDocs, (playerDoc) => getPlayer(ctx.db, playerDoc)),
    };
  },
});

export async function getPlayer(db: DatabaseReader, playerDoc: Doc<'players'>) {
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
      audience: latestConversation.data.audience,
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
            relationship: relationship?.description,
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
  handler: async (ctx, { playerId, audience }) => {
    const allPlayers = [playerId, ...audience];
    const playerDoc = (await ctx.db.get(playerId))!;
    const { worldId } = playerDoc;
    const conversationId = await ctx.db.insert('conversations', { worldId });
    for (const player of allPlayers) {
      const subjectiveAudience = allPlayers.filter((p) => p !== player);
      await ctx.db.insert('journal', {
        playerId: player,
        data: {
          type: 'startConversation',
          audience: subjectiveAudience,
          conversationId,
        },
      });
    }
    return conversationId;
  },
});

export const userTalkModerated = action({
  args: {
    content: v.string(),
  },
  handler: async (ctx, { content }): Promise<{ contentId: Id<'user_input'>; flagged: boolean }> => {
    const contentId = await ctx.runMutation(internal.journal.proposeUserInput, { content });

    const { flagged } = (await fetchModeration(content)).results[0];

    await ctx.runMutation(internal.journal.moderatedUserInput, { contentId, result: !flagged });
    return { contentId, flagged };
  },
});

export const proposeUserInput = internalMutation(async (ctx, { content }: { content: string }) => {
  const userIdentity = await ctx.auth.getUserIdentity();
  if (!userIdentity) {
    throw new Error('must be logged in to propose user input');
  }
  return await ctx.db.insert('user_input', { content, user: userIdentity.tokenIdentifier });
});

export const moderatedUserInput = internalMutation(
  async (ctx, { contentId, result }: { contentId: Id<'user_input'>; result: boolean }) => {
    await ctx.db.patch(contentId, { moderationResult: result });
  },
);

export const userTalk = mutation({
  args: {
    contentId: v.id('user_input'),
  },
  handler: async (ctx, { contentId }) => {
    const playerDoc = await activePlayerDoc(ctx.auth, ctx.db);
    if (!playerDoc) return;
    const player = await getPlayer(ctx.db, playerDoc);
    if (!player.lastChat) return;
    const userInput = (await ctx.db.get(contentId))!;
    if (!userInput.moderationResult) {
      throw new Error(`moderation rejected user input ${contentId}`);
    }
    await ctx.db.insert('journal', {
      playerId: player.id,
      data: {
        type: 'talking',
        audience: player.lastChat.audience,
        conversationId: player.lastChat.conversationId,
        content: userInput.content,
        relatedMemoryIds: [],
      },
    });
    await ctx.db.patch(player.id, {
      controllerThinking: undefined,
    });
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

export const talkMore = internalMutation({
  args: {
    entryId: v.id('journal'),
    content: v.string(),
  },
  handler: async (ctx, { entryId, content }) => {
    const data = (await ctx.db.get(entryId))!.data;
    if (data.type === 'talking') {
      data.content = content;
    }
    await ctx.db.patch(entryId, { data });
    return await clientMessageMapper(ctx.db)((await ctx.db.get(entryId))! as MessageEntry);
  },
});

export const currentConversation = async (db: DatabaseReader, playerId: Id<'players'>) => {
  const conversation = await getLatestPlayerConversation(db, playerId);
  if (!conversation) {
    return null;
  }
  if (conversation.data.type === 'leaveConversation') {
    return null;
  }
  const latestChat = await conversationQuery(db, conversation.data.conversationId).first();
  if (latestChat!.data.type === 'leaveConversation') {
    return null;
  }
  return conversation.data;
};

export const talkingToUser = async (db: DatabaseReader, playerId: Id<'players'>) => {
  const lastConversation = await currentConversation(db, playerId);
  if (!lastConversation) {
    return null;
  }
  for (const audienceId of lastConversation.audience) {
    const player = await db.get(audienceId);
    if (!player || player.agentId) {
      continue; // Not a user.
    }
    const playerConversation = await currentConversation(db, audienceId);
    if (playerConversation?.conversationId === lastConversation.conversationId) {
      return true;
    }
  }
  return false;
};

export const leaveConversation = internalMutation({
  args: {
    playerId: v.id('players'),
  },
  handler: async (ctx, { playerId }) => {
    const conversation = await currentConversation(ctx.db, playerId);
    if (!conversation) {
      return;
    }
    await ctx.db.insert('journal', {
      playerId,
      data: {
        type: 'leaveConversation',
        audience: conversation.audience,
        conversationId: conversation.conversationId,
      },
    });
    try {
      await ctx.db.patch(playerId, { controllerThinking: undefined });
    } catch (e) {
      // It's okay if the player has been deleted.
    }
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

export const turnToFace = internalMutation({
  args: { playerId: v.id('players'), targetId: v.id('players') },
  handler: async (ctx, { playerId, targetId }) => {
    const us = await getLatestPlayerMotion(ctx.db, playerId);
    const them = await getLatestPlayerMotion(ctx.db, targetId);
    const targetPos = them.type === 'stopped' ? them.pose.position : them.route.at(-1)!;
    if (us.type === 'stopped') {
      us.pose.orientation = calculateOrientation(us.pose.position, targetPos);
    } else {
      us.endOrientation = calculateOrientation(us.route.at(-1)!, targetPos);
    }
    await ctx.db.insert('journal', {
      playerId,
      data: us,
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
    const targetPosition = target
      ? roundPose(getPoseFromMotion(await getLatestPlayerMotion(ctx.db, target), ts)).position
      : getRandomPosition(map);
    return await walkToTarget(ctx, playerId, worldId, ignore, targetPosition);
  },
});

const isNPC = async (db: DatabaseReader, playerId: Id<'players'>) => {
  const player = await db.get(playerId);
  return player && !!player.agentId;
};

export const walkToTarget = async (
  ctx: MutationCtx,
  playerId: Id<'players'>,
  worldId: Id<'worlds'>,
  ignore: Id<'players'>[],
  targetPosition: Position,
) => {
  const ts = Date.now();
  const world = (await ctx.db.get(worldId))!;
  const map = (await ctx.db.get(world.mapId))!;
  const npc = await isNPC(ctx.db, playerId);
  // Allow controlled players to walk over other characters.
  // This reduces OCCs because user-triggered mutations don't need to read
  // all player locations, and it prevents users from getting stuck.
  const otherPlayers = npc
    ? await asyncMap(
        (await getAllPlayers(ctx.db, worldId)).filter((p) => p._id !== playerId),
        async (p) => ({
          ...p,
          motion: await getLatestPlayerMotion(ctx.db, p._id),
        }),
      )
    : [];
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
          pose: {
            position: route[0],
            orientation: calculateOrientation(route[0], targetPosition),
          },
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
  const speed = npc ? 1 : 2;
  const targetEndTs = ts + (distance * TIME_PER_STEP) / speed;
  let endOrientation: number | undefined;
  if (manhattanDistance(targetPosition, route[route.length - 1]) > 0) {
    endOrientation = calculateOrientation(route[route.length - 1], targetPosition);
  }
  await ctx.db.insert('journal', {
    playerId,
    data: { type: 'walking', route, ignore, startTs: ts, targetEndTs, endOrientation },
  });
  const collisions = findCollision(
    route,
    otherPlayers.filter((p) => !exclude.has(p._id)),
    ts,
    CLOSE_DISTANCE,
  );
  return {
    targetEndTs,
    nextCollision: collisions && {
      ts: collisions.distance * TIME_PER_STEP + ts,
      agentIds: pruneNull(collisions.hits.map(({ agentId }) => agentId)),
    },
  };
};

export const nextCollision = async (
  db: DatabaseReader,
  worldId: Id<'worlds'>,
  playerId: Id<'players'>,
  ignore: Id<'players'>[],
) => {
  const ts = Date.now();
  const exclude = new Set([...ignore, playerId]);
  const otherPlayers = await asyncMap(
    (await getAllPlayers(db, worldId)).filter((p) => !exclude.has(p._id)),
    async (p) => ({ ...p, motion: await getLatestPlayerMotion(db, p._id) }),
  );
  const ourMotion = await getLatestPlayerMotion(db, playerId);
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
};

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
