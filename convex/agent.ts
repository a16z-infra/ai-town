// TODO: use node once vector search is available there, or w/ Pinecone
// 'use node';
// ^ This tells Convex to run this in a `node` environment.
// Read more: https://docs.convex.dev/functions/runtimes
import { v } from 'convex/values';
import { internal } from './_generated/api';
import { Doc, Id } from './_generated/dataModel';

import {
  ActionCtx,
  DatabaseReader,
  internalAction,
  internalMutation,
  internalQuery,
} from './_generated/server';
import { MemoryDB } from './lib/memory';
import {
  MemoryOfType,
  Position,
  EntryOfType,
  Message,
  EntryType,
  MemoryType,
  Player,
  MessageEntry,
} from './schema';
import { chatHistoryFromMessages, converse, walkAway } from './conversation';
import { asyncMap, pruneNull } from './lib/utils';
import { getAllPlayers } from './players';
import { CLOSE_DISTANCE, DEFAULT_START_POSE, NEARBY_DISTANCE, TIME_PER_STEP } from './config';
import { findCollision, findRoute } from './lib/routing';
import { getPoseFromMotion, manhattanDistance, roundPose } from './lib/physics';
import { clientMessageMapper } from './chat';

type DoneFn = (
  agentId: Id<'agents'>,
  otherAgentIds?: Id<'agents'>[],
  wakeTs?: number,
) => Promise<void>;
export const runAgentBatch = internalAction({
  args: {
    playerIds: v.array(v.id('players')),
    noSchedule: v.optional(v.boolean()),
  },
  handler: async (ctx, { playerIds, noSchedule }) => {
    const memory = MemoryDB(ctx);
    const done: DoneFn = async (agentId, otherAgentIds, wakeTs) => {
      await ctx.runMutation(internal.engine.agentDone, {
        agentId,
        otherAgentIds,
        wakeTs,
        noSchedule,
      });
    };

    // Get the current state of the world
    const { players } = await ctx.runQuery(internal.agent.getSnapshot, { playerIds });
    const playerById = new Map(players.map((p) => [p.id, p]));
    // Segment users by location
    const groups: Player[][] = [];
    const solos: Player[] = [];
    while (playerById.size > 0) {
      const player = playerById.values().next().value;
      playerById.delete(player.id);
      const nearbyPlayers = getNearbyPlayers(player, [...playerById.values()]);
      if (nearbyPlayers.length > 0) {
        groups.push([player, ...nearbyPlayers]);
        for (const nearbyPlayer of nearbyPlayers) {
          playerById.delete(nearbyPlayer.id);
        }
      } else {
        solos.push(player);
      }
    }
    // Run a conversation for each group.
    const groupPromises = groups.map(async (group) => {
      await handleAgentInteraction(ctx, group, memory, done);
    });
    // For those not in a group, run the solo agent loop.
    const soloPromises = solos.map(async (player) => {
      await handleAgentSolo(ctx, player, memory, done);
    });

    // Make a structure that resolves when the agent yields.
    // It should fail to do any actions if the agent has already yielded.

    await Promise.allSettled([...groupPromises, ...soloPromises]);
    // TODO: mark agents as done as they finish conversation / solo time.
    for (const player of players) {
      if (player.agentId) {
        // TODO: single-flight action API to avoid contention.
      }
    }
  },
});

async function handleAgentSolo(ctx: ActionCtx, player: Player, memory: MemoryDB, done: DoneFn) {
  // Handle new observations
  //   Calculate scores
  //   If there's enough observation score, trigger reflection?
  // Future: Store observations about seeing players?
  //  might include new observations -> add to memory with openai embeddings
  // Based on plan and observations, determine next action:
  //   if so, add new memory for new plan, and return new action
  if (player.agentId) {
    if (player.motion.type === 'stopped' || player.motion.targetEndTs > Date.now()) {
      const { nextCollision, targetEndTs } = await ctx.runMutation(internal.agent.walk, {
        playerId: player.id,
        ignore: [],
      });
      await done(player.agentId, nextCollision?.agentIds, nextCollision?.ts ?? targetEndTs);
    } else {
      await done(player.agentId);
    }
  }
}

export async function handleAgentInteraction(
  ctx: ActionCtx,
  players: Player[],
  memory: MemoryDB,
  done: DoneFn,
) {
  for (const player of players) {
    const imWalkingHere =
      player.motion.type === 'walking' && player.motion.targetEndTs > Date.now();
    // Get players to walk together and face each other
  }

  // TODO: pick a better conversation starter
  const conversationId = await ctx.runMutation(internal.agent.makeConversation, {
    playerId: players[0].id,
    audience: players.slice(1).map((p) => p.id),
  });

  const playerById = new Map(players.map((p) => [p.id, p]));
  const relations = await ctx.runQuery(internal.agent.getRelationships, {
    playerIds: players.map((p) => p.id),
  });
  const relationshipsByPlayerId = new Map(
    relations.map(({ playerId, relations }) => [
      playerId,
      relations.map((r) => ({ ...playerById.get(playerId)!, relationship: r.relationship })),
    ]),
  );

  const messages: Message[] = [];

  // TODO: real logic. this just sends one message each!
  for (const player of players) {
    const playerId = player.id;
    const chatHistory = chatHistoryFromMessages(messages);
    const audience = players.filter((p) => p.id !== player.id).map((p) => p.id);
    // Converse
    const shouldWalkAway = await walkAway(chatHistory, player);
    console.log('shouldWalkAway: ', shouldWalkAway);

    // Decide if we keep talking.
    if (shouldWalkAway) {
      // It's to chatty here, let's go somewhere else.
      await ctx.runMutation(internal.agent.leaveConversation, {
        playerId,
        audience,
        conversationId,
      });
      // TODO: remove this player from the audience list
    }
    const playerRelations = relationshipsByPlayerId.get(player.id)!;
    // TODO: stream the response and write to the mutation for every sentence.
    const playerCompletion = await converse(chatHistory, player, playerRelations, memory);
    const message = await ctx.runMutation(internal.agent.talk, {
      playerId,
      audience,
      content: playerCompletion,
      conversationId,
    });
    if (message) {
      messages.push(message);
    }
  }

  for (const player of players) {
    await memory.rememberConversation(player.name, player.id, player.identity, conversationId);
    const { nextCollision, targetEndTs } = await ctx.runMutation(internal.agent.walk, {
      playerId: player.id,
      ignore: players.map((p) => p.id),
    });
    if (player.agentId) {
      await done(player.agentId, nextCollision?.agentIds ?? [], nextCollision?.ts ?? targetEndTs);
    }
  }
}

/**
 * QUERY AND MUTATIONS
 *
 * These can live here unless we use "use node"; at the top of the file, in which
 * case we need to move them to another file, maybe agentAPI.ts?
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

// export async function getAgentSnapshot(ctx: QueryCtx, playerId: Id<'players'>) {
//   const playerDoc = (await ctx.db.get(playerId))!;
//   const player = await getPlayer(ctx.db, playerDoc);
//   // Could potentially do a smarter filter in the future to only get
//   // players that are nearby, but for now, just get all of them.
//   const allPlayers = await asyncMap(await getAllPlayers(ctx.db, playerDoc.worldId), (playerDoc) =>
//     getPlayer(ctx.db, playerDoc),
//   );
//   const snapshot = await makeSnapshot(ctx.db, player, allPlayers);
//   return snapshot;
// }

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

function getNearbyPlayers(target: Player, others: Player[]) {
  const ts = Date.now();
  const targetPose = getPoseFromMotion(target.motion, ts);
  return others.filter((a) => {
    const distance = manhattanDistance(
      targetPose.position,
      getPoseFromMotion(a.motion, ts).position,
    );
    return distance < NEARBY_DISTANCE;
  });
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

/**
 * Actions
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
  },
  handler: async (ctx, { playerId, audience, conversationId, content, ...args }) => {
    if (audience.length === 0) {
      console.log("Didn't talk");
      return null;
    }
    const entryId = await ctx.db.insert('journal', {
      playerId,
      data: { type: 'talking', audience, conversationId, content },
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
    if (audience.length === 0) {
      console.log('No one left in convo');
    } else {
      console.log(playerId, 'Left', conversationId, 'with', audience);
    }
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
        // TODO: maybe model stopping as a path of length 1 or 2 instead of
        // its own type. Then we can continue along the existing path instead of
        // snapping to the final location.
        // A path of length 2 could start in the past to make it smooth.
        pose: roundPose(getPoseFromMotion(motion, Date.now())),
      },
    });
  },
});

// TODO: allow specifying a specific place to go, ideally a named Zone.
export const walk = internalMutation({
  args: { playerId: v.id('players'), ignore: v.array(v.id('players')) },
  handler: async (ctx, { playerId, ignore, ...args }) => {
    const ts = Date.now();
    const playerDoc = (await ctx.db.get(playerId))!;
    const world = (await ctx.db.get(playerDoc.worldId))!;
    const map = (await ctx.db.get(world.mapId))!;
    const exclude = new Set([...ignore, playerId]);
    const otherPlayers = await asyncMap(
      (await getAllPlayers(ctx.db, playerDoc.worldId)).filter((p) => !exclude.has(p._id)),
      async (p) => ({ id: p.agentId, motion: await getLatestPlayerMotion(ctx.db, p._id) }),
    );
    const ourMotion = await getLatestPlayerMotion(ctx.db, playerId);
    const { route, distance } = findRoute(
      map,
      ourMotion,
      otherPlayers.map(({ motion }) => motion),
      getRandomPosition(world), // TODO: walk somewhere more meaningful
      ts,
    );
    const targetEndTs = ts + distance * TIME_PER_STEP;
    const collisions = findCollision(route, otherPlayers, ts, CLOSE_DISTANCE);
    await ctx.db.insert('journal', {
      playerId,
      data: { type: 'walking', route, startTs: ts, targetEndTs },
    });
    return {
      targetEndTs,
      nextCollision: collisions && {
        ts: collisions.distance * TIME_PER_STEP + ts,
        agentIds: pruneNull(collisions.ids),
      },
    };
  },
});

export function getRandomPosition(world: Doc<'worlds'>): Position {
  return {
    x: Math.floor(Math.random() * world.width),
    y: Math.floor(Math.random() * world.height),
  };
}
