import { v } from 'convex/values';
import { internal } from './_generated/api';
import { Doc, Id } from './_generated/dataModel';
import {
  DatabaseReader,
  DatabaseWriter,
  MutationCtx,
  QueryCtx,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server';
import {
  EntryType,
  EntryOfType,
  MemoryOfType,
  MemoryType,
  Action,
  Player,
  Pose,
  Snapshot,
  Motion,
} from './types.js';
import { asyncMap, pruneNull } from './lib/utils.js';
import { getPoseFromMotion, manhattanDistance, roundPose } from './lib/physics.js';
import { findCollision, findRoute } from './lib/routing';
import { clientMessageMapper } from './chat';
import { getAllPlayers } from './players';

export const NEARBY_DISTANCE = 10;
export const TIME_PER_STEP = 250;
export const DEFAULT_AGENT_IDLE = 30_000;
// If you don't set a start position, you'll start at 0,0.
export const DEFAULT_START_POSE: Pose = { position: { x: 0, y: 0 }, orientation: 0 };
export const CONVERSATION_DEAD_THRESHOLD = 600_000; // In ms

export const tick = internalMutation({
  args: { worldId: v.id('worlds'), forPlayers: v.optional(v.array(v.id('players'))) },
  handler: async (ctx, { worldId, forPlayers }) => {
    const ts = Date.now();
    const world = (await ctx.db.get(worldId))!;
    if (world.frozen) return;
    const playerDocs = await getAllPlayers(ctx.db, worldId);
    // Make snapshot of world
    const playerSnapshots = await asyncMap(playerDocs, async (playerDoc) =>
      getPlayer(ctx.db, playerDoc),
    );

    // TODO: coordinate shared interactions (shared focus)

    // Sort players by how long ago they last spoke
    playerSnapshots.sort((a, b) => a.lastSpokeTs - b.lastSpokeTs);

    // For each player (oldest to newest? Or all on the same step?):
    for (let idx = 0; idx < playerSnapshots.length; idx++) {
      const player = playerSnapshots[idx];
      // TODO: if the player hasn't finished for a long time,
      // try anyways and handle rejecting old actions.
      if (player.thinking) continue;
      // For ticks specific to a user, only run for that user.
      if (forPlayers && !forPlayers.includes(player.id)) continue;

      // TODO: If the player's path is blocked, stop or re-route.
      // If the player has arrived at their destination, update it.
      if (player.motion.type === 'walking' && player.motion.targetEndTs <= ts) {
        const motion = {
          type: 'stopped',
          reason: 'idle',
          pose: roundPose(getPoseFromMotion(player.motion, ts)),
        } as Motion;
        await ctx.db.insert('journal', {
          playerId: player.id,
          data: motion,
        });
        // Give the snapshot the latest player state.
        // A bit hacky, we could re-create the player state, but fine for now.
        player.motion = motion;
      }

      // TODO: Determine if any players are not worth waking up
      const snapshot = await makeSnapshot(ctx.db, player, playerSnapshots);
      // We mark ourselves as thining AFTER the snapshot, so the snapshot can
      // access the previous plan.
      const thinkId = await ctx.db.insert('journal', {
        playerId: snapshot.player.id,
        data: {
          type: 'thinking',
          snapshot,
        },
      });
      // Fetch the new state
      const playerDoc = playerDocs.find((d) => d._id === player.id)!;
      // Replace it for other players.
      playerSnapshots[idx] = await getPlayer(ctx.db, playerDoc);
      // For players worth waking up: schedule action
      await ctx.scheduler.runAfter(0, internal.agent.runAgent, { snapshot, world, thinkId });
      // TODO: handle timeouts
      // Later: handle object ownership?
    }
  },
});

export async function getAgentSnapshot(ctx: QueryCtx, playerId: Id<'players'>) {
  const playerDoc = (await ctx.db.get(playerId))!;
  const player = await getPlayer(ctx.db, playerDoc);
  // Could potentially do a smarter filter in the future to only get
  // players that are nearby, but for now, just get all of them.
  const allPlayers = await asyncMap(await getAllPlayers(ctx.db, playerDoc.worldId), (playerDoc) =>
    getPlayer(ctx.db, playerDoc),
  );
  const snapshot = await makeSnapshot(ctx.db, player, allPlayers);
  return snapshot;
}

export const handleAgentAction = internalMutation({
  args: { playerId: v.id('players'), action: Action, noSchedule: v.optional(v.boolean()) },
  handler: handlePlayerAction,
});

export async function handlePlayerAction(
  ctx: MutationCtx,
  {
    playerId,
    action,
    noSchedule,
  }: { playerId: Id<'players'>; action: Action; noSchedule?: boolean },
) {
  const ts = Date.now();
  const playerDoc = (await ctx.db.get(playerId))!;
  const { worldId } = playerDoc;
  const tick = async (forPlayers?: Id<'players'>[], at?: number) => {
    if (noSchedule) return;
    if (at) await ctx.scheduler.runAt(at, internal.engine.tick, { worldId, forPlayers });
    else await ctx.scheduler.runAfter(0, internal.engine.tick, { worldId, forPlayers });
  };
  const player = await getPlayer(ctx.db, playerDoc);
  // TODO: Check if the player should still respond.
  let entryId: Id<'journal'> | undefined;
  switch (action.type) {
    case 'startConversation':
      // TODO: determine if any players are available.
      const conversationId = await ctx.db.insert('conversations', { worldId });
      entryId = await ctx.db.insert('journal', {
        playerId,
        data: {
          ...action,
          conversationId,
        },
      });
      await tick(action.audience);
      break;
    case 'talking':
      // TODO: Check if these players are still nearby
      entryId = await ctx.db.insert('journal', {
        playerId,
        data: action,
      });
      await tick(action.audience);
      break;
    case 'leaveConversation':
      entryId = await ctx.db.insert('journal', {
        playerId,
        data: action,
      });
      break;
    case 'travel':
      const world = (await ctx.db.get(playerDoc.worldId))!;
      const map = (await ctx.db.get(world.mapId))!;
      const pose = getPoseFromMotion(player.motion, ts);
      const otherPlayerMotion = await asyncMap(
        (await getAllPlayers(ctx.db, world._id)).filter((p) => p._id !== player.id),
        async (p) => getLatestPlayerMotion(ctx.db, p._id),
      );
      // TODO: Walk around other players along the way
      const { route, distance } = findRoute(
        map,
        player.motion,
        otherPlayerMotion,
        action.position,
        ts,
      );
      // TODO: get the player IDs who we'll run into first, to schedule a tick.
      const nextCollisionDistance = findCollision(
        route,
        otherPlayerMotion.filter(
          // Filter out players we're already around.
          (motion) =>
            manhattanDistance(pose.position, getPoseFromMotion(motion, ts).position) >
            NEARBY_DISTANCE,
        ),
        ts,
        NEARBY_DISTANCE,
      );
      const targetEndTs = ts + distance * TIME_PER_STEP;
      entryId = await ctx.db.insert('journal', {
        playerId,
        data: { type: 'walking', route, startTs: ts, targetEndTs },
      });
      await tick(
        [playerId],
        nextCollisionDistance === null ? targetEndTs : ts + nextCollisionDistance * TIME_PER_STEP,
      );
      break;
    case 'done':
      const thinkEntry = await latestEntryOfType(ctx.db, playerId, 'thinking');
      if (thinkEntry?._id !== action.thinkId) {
        throw new Error('Think ID does not match: ' + action.thinkId + ' vs ' + thinkEntry?._id);
      }
      thinkEntry.data.finishedTs = ts;
      await ctx.db.replace(action.thinkId, thinkEntry);
      entryId = thinkEntry._id;
      break;
    case 'stop':
      entryId = await ctx.db.insert('journal', {
        playerId,
        data: {
          type: 'stopped',
          reason: 'interrupted',
          pose: roundPose(getPoseFromMotion(player.motion, ts)),
        },
      });
      break;
    default:
      const _exhaustiveCheck: never = action;
      if (!entryId) throw new Error('unreachable');
  }
  return (await ctx.db.get(entryId))!;
}

async function makeSnapshot(
  db: DatabaseReader,
  player: Player,
  otherPlayersAndMe: Player[],
): Promise<Snapshot> {
  const lastThink = await latestEntryOfType(db, player.id, 'thinking');
  const otherPlayers = otherPlayersAndMe.filter((d) => d.id !== player.id);
  const nearbyPlayers = await asyncMap(getNearbyPlayers(player, otherPlayers), async (other) => ({
    player: other,
    relationship:
      (await latestRelationshipMemoryWith(db, player.id, other.id))?.description ??
      `${player.name} doesn't know ${other.name}`,
    new: !lastThink?.data.snapshot.nearbyPlayers.find((a) => a.player.id === other.id),
  }));
  const planEntry = await latestMemoryOfType(db, player.id, 'plan');
  return {
    player,
    lastPlan: planEntry ? { plan: planEntry.description, ts: planEntry._creationTime } : undefined,
    nearbyPlayers,
    nearbyConversations: await getNearbyConversations(
      db,
      player.id,
      otherPlayersAndMe.map(({ id }) => id),
    ),
  };
}

export async function getPlayer(db: DatabaseReader, playerDoc: Doc<'players'>): Promise<Player> {
  const lastThink = await latestEntryOfType(db, playerDoc._id, 'thinking');
  const lastChat = await latestEntryOfType(db, playerDoc._id, 'talking');
  const identityEntry = await latestMemoryOfType(db, playerDoc._id, 'identity');
  const identity = identityEntry?.description ?? 'I am a person.';

  return {
    id: playerDoc._id,
    name: playerDoc.name,
    characterId: playerDoc.characterId,
    identity,
    thinking: !!lastThink && !lastThink?.data.finishedTs,
    lastSpokeTs: lastChat?._creationTime ?? 0,
    lastSpokeConversationId: lastChat?.data.conversationId,
    motion: await getLatestPlayerMotion(db, playerDoc._id),
  };
}

export async function getLatestPlayerMotion(db: DatabaseReader, playerId: Id<'players'>) {
  const lastStop = await latestEntryOfType(db, playerId, 'stopped');
  const lastWalk = await latestEntryOfType(db, playerId, 'walking');
  const latestMotion = pruneNull([lastStop, lastWalk])
    .sort((a, b) => a._creationTime - b._creationTime)
    .pop()?.data;
  return latestMotion ?? { type: 'stopped', reason: 'idle', pose: DEFAULT_START_POSE };
}

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

async function getNearbyConversations(
  db: DatabaseReader,
  playerId: Id<'players'>,
  playerIds: Id<'players'>[],
): Promise<Snapshot['nearbyConversations']> {
  const conversationsById = pruneNull(
    await asyncMap(playerIds, async (playerId) => await latestEntryOfType(db, playerId, 'talking')),
  )
    // Filter out old conversations
    .filter((entry) => Date.now() - entry._creationTime < CONVERSATION_DEAD_THRESHOLD)
    // Get the latest message for each conversation, keyed by conversationId.
    .reduce<Record<Id<'conversations'>, EntryOfType<'talking'>>>((convos, entry) => {
      const existing = convos[entry.data.conversationId];
      if (!existing || existing._creationTime < entry._creationTime) {
        convos[entry.data.conversationId] = entry;
      }
      return convos;
    }, {});
  // Now, filter out conversations that did't include the observer.
  const conversations = Object.values(conversationsById).filter(
    (entry) => entry.data.audience.includes(playerId) || entry.playerId === playerId,
  );
  const leftConversations = (
    (await db
      .query('journal')
      .withIndex('by_playerId_type', (q) =>
        q.eq('playerId', playerId).eq('data.type', 'leaveConversation'),
      )
      .filter((q) =>
        q.or(
          ...conversations.map((c) => q.eq(q.field('data.conversationId'), c.data.conversationId)),
        ),
      )
      .collect()) as EntryOfType<'leaveConversation'>[]
  ).map((e) => e.data.conversationId);
  const stillInConversations = conversations.filter(
    (c) => !leftConversations.includes(c.data.conversationId),
  );
  return (
    await asyncMap(stillInConversations, async (entry) => ({
      conversationId: entry.data.conversationId,
      messages: (
        await asyncMap(await fetchMessages(db, entry.data.conversationId), clientMessageMapper(db))
      ).filter((message) => message.to.includes(playerId) || message.from === playerId),
    }))
  ).filter((c) => c.messages.length > 0);
}

async function fetchMessages(db: DatabaseReader, conversationId: Id<'conversations'>) {
  const messageEntries = await db
    .query('journal')
    .withIndex('by_conversation', (q) => q.eq('data.conversationId', conversationId as any))
    .filter((q) => q.eq(q.field('data.type'), 'talking'))
    .collect();
  return messageEntries.filter(
    (e) => e.data.type !== 'leaveConversation' && e.data.type,
  ) as EntryOfType<'talking'>[];
}

async function latestEntryOfType<T extends EntryType>(
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

async function latestMemoryOfType<T extends MemoryType>(
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

export const freezeAll = internalMutation({
  args: {},
  handler: async (ctx, args) => {
    const worlds = await ctx.db.query('worlds').collect();
    for (const world of worlds) {
      await ctx.db.patch(world._id, { frozen: true });
    }
  },
});

export const unfreezeAll = internalMutation({
  args: {},
  handler: async (ctx, args) => {
    const worlds = await ctx.db.query('worlds').collect();
    for (const world of worlds) {
      await ctx.db.patch(world._id, { frozen: false });
    }
    for (const world of worlds) {
      await ctx.scheduler.runAfter(0, internal.engine.tick, { worldId: world._id });
    }
  },
});
