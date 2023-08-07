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
  Message,
} from './types.js';
import { asyncMap, pruneNull } from './lib/utils.js';
import { getPoseFromMotion, manhattanDistance, roundPose } from './lib/physics.js';
import { findCollision, findRoute } from './lib/routing';
import { clientMessageMapper } from './chat';
import { getAllPlayers } from './players';

export const NEARBY_DISTANCE = 3;
// Close enough to stop and observe something.
export const CLOSE_DISTANCE = 2;
export const TIME_PER_STEP = 1000;
export const DEFAULT_AGENT_IDLE = 300_000;
// If you don't set a start position, you'll start at 0,0.
export const DEFAULT_START_POSE: Pose = { position: { x: 0, y: 0 }, orientation: 0 };
export const CONVERSATION_DEAD_THRESHOLD = 600_000; // In ms
export const HEARTBEAT_PERIOD = 30_000; // In ms
export const WORLD_IDLE_THRESHOLD = 300_000; // In ms

export const tick = internalMutation({
  args: { worldId: v.id('worlds'), forPlayers: v.optional(v.array(v.id('players'))) },
  handler: async (ctx, { worldId, forPlayers }) => {
    const ts = Date.now();
    const world = (await ctx.db.get(worldId))!;
    if (world.frozen) return;
    const lastHeartbeat = await ctx.db.query('heartbeats').order('desc').first();
    if (!lastHeartbeat || lastHeartbeat._creationTime + WORLD_IDLE_THRESHOLD < ts) {
      console.log("Didn't tick: no heartbeat recently");
      return;
    }
    const playerDocs = await getAllPlayers(ctx.db, worldId);
    // Make snapshot of world
    const playerSnapshots = await asyncMap(playerDocs, async (playerDoc) =>
      getPlayer(ctx.db, playerDoc),
    );

    // Sort players by how long ago they last spoke
    playerSnapshots.sort((a, b) => (a.lastChat?.message.ts ?? 0) - (b.lastChat?.message.ts ?? 0));

    // For each player (oldest to newest? Or all on the same step?):
    for (let idx = 0; idx < playerSnapshots.length; idx++) {
      const player = playerSnapshots[idx];
      // If the player hasn't finished for a long time,
      // try anyways and handle rejecting old actions.
      if (player.thinking) {
        if (player.lastThinkTs && player.lastThinkTs + DEFAULT_AGENT_IDLE < ts) {
          console.error(`Player ${player.id} has been thinking for too long. Scheduling anyways.`);
        } else {
          continue;
        }
      }
      // For ticks specific to a user, only run for that user.
      if (forPlayers && !forPlayers.includes(player.id)) continue;

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
      const available = pruneNull(
        await asyncMap(action.audience, async (playerId) => {
          const latestConversation = await getLatestPlayerConversation(ctx.db, playerId);
          const latestLeft = await latestEntryOfType(ctx.db, playerId, 'leaveConversation');
          return (latestLeft?._creationTime ?? Date.now()) >
            (latestConversation?._creationTime ?? 0)
            ? playerId
            : null;
        }),
      );
      if (available.length === 0) {
        return null;
      }
      action.audience = available;
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
      const targetEndTs = ts + distance * TIME_PER_STEP;
      entryId = await ctx.db.insert('journal', {
        playerId,
        data: { type: 'walking', route, startTs: ts, targetEndTs },
      });
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
        CLOSE_DISTANCE,
      );
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
    nearbyConversations: await getNearbyConversations(db, player.id, otherPlayersAndMe),
  };
}

export async function getPlayer(db: DatabaseReader, playerDoc: Doc<'players'>): Promise<Player> {
  const lastThink = await latestEntryOfType(db, playerDoc._id, 'thinking');
  const latestConversation = await getLatestPlayerConversation(db, playerDoc._id);
  const identityEntry = await latestMemoryOfType(db, playerDoc._id, 'identity');
  const identity = identityEntry?.description ?? 'I am a person.';

  return {
    id: playerDoc._id,
    name: playerDoc.name,
    characterId: playerDoc.characterId,
    identity,
    thinking: !!lastThink && !lastThink?.data.finishedTs,
    lastThinkTs: lastThink?._creationTime,
    lastThinkEndTs: lastThink?.data.finishedTs,
    lastChat: latestConversation && {
      message: await clientMessageMapper(db)(latestConversation),
      conversationId: latestConversation.data.conversationId,
    },
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

async function getLatestPlayerConversation(db: DatabaseReader, playerId: Id<'players'>) {
  const lastChat = await latestEntryOfType(db, playerId, 'talking');
  const lastStartChat = await latestEntryOfType(db, playerId, 'startConversation');
  const lastLeaveChat = await latestEntryOfType(db, playerId, 'leaveConversation');
  return pruneNull([lastChat, lastStartChat, lastLeaveChat])
    .sort((a, b) => a._creationTime - b._creationTime)
    .pop();
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
  players: Player[],
): Promise<Snapshot['nearbyConversations']> {
  const playersById = players.reduce<Record<Id<'players'>, Player>>((byId, player) => {
    byId[player.id] = player;
    return byId;
  }, {});
  const conversationsById = pruneNull(players.map((p) => p.lastChat))
    // Filter out conversations they left
    .filter((chat) => chat.message.type !== 'left')
    // Filter out old conversations
    .filter((chat) => Date.now() - chat.message.ts < CONVERSATION_DEAD_THRESHOLD)
    // Get the latest message for each conversation, keyed by conversationId.
    .reduce<Record<Id<'conversations'>, { message: Message; conversationId: Id<'conversations'> }>>(
      (convos, chat) => {
        const existing = convos[chat.conversationId];
        if (!existing || existing.message.ts < chat.message.ts) {
          convos[chat.conversationId] = chat;
        }
        return convos;
      },
      {},
    );
  // Now, filter out conversations that did't include the observer.
  const conversations = Object.values(conversationsById).filter(
    (chat) => chat.message.to.includes(playerId) || chat.message.from === playerId,
  );
  const leftConversations = (
    (await db
      .query('journal')
      .withIndex('by_playerId_type', (q) =>
        q.eq('playerId', playerId).eq('data.type', 'leaveConversation'),
      )
      .filter((q) =>
        q.or(...conversations.map((c) => q.eq(q.field('data.conversationId'), c.conversationId))),
      )
      .collect()) as EntryOfType<'leaveConversation'>[]
  ).map((e) => e.data.conversationId);
  const stillInConversations = conversations.filter(
    (c) => !leftConversations.includes(c.conversationId),
  );
  const otherIds = new Set(players.map((p) => p.id));
  otherIds.delete(playerId);
  return (
    (
      await asyncMap(stillInConversations, async (entry) => ({
        conversationId: entry.conversationId,
        messages: (
          await asyncMap(await fetchMessages(db, entry.conversationId), clientMessageMapper(db))
        ).filter((message) => message.to.includes(playerId) || message.from === playerId),
      }))
    )
      // Filter out any conversations where all other message senders are not present
      .filter((c) => c.messages.filter((m) => otherIds.has(m.from)).length > 0)
  );
}

async function fetchMessages(db: DatabaseReader, conversationId: Id<'conversations'>) {
  const messageEntries = await db
    .query('journal')
    .withIndex('by_conversation', (q) => q.eq('data.conversationId', conversationId as any))
    .filter((q) => q.eq(q.field('data.type'), 'talking'))
    .collect();
  return messageEntries as EntryOfType<'talking'>[];
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
