import { v } from 'convex/values';
import { api, internal } from './_generated/api';
import { Doc, Id } from './_generated/dataModel';
import {
  DatabaseReader,
  DatabaseWriter,
  MutationCtx,
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server';
import { Entry, GameTs, EntryType, EntryOfType, MemoryOfType, MemoryType } from './schema';
import { Action, Player, Snapshot, Status } from './types.js';
import { asyncMap, pruneNull } from './lib/utils.js';
import {
  Pose,
  calculateFraction,
  findRoute,
  getPoseFromRoute,
  manhattanDistance,
} from './lib/physics.js';

export const NEARBY_DISTANCE = 5;
export const TIME_PER_STEP = 1000;
export const DEFAULT_AGENT_IDLE = 30_000;
// If you don't set a start position, you'll start at 0,0.
export const DEFAULT_START_POS = { x: 0, y: 0 };

export const tick = internalMutation({
  args: { worldId: v.id('worlds'), oneShot: v.optional(v.id('players')) },
  handler: async (ctx, { worldId, oneShot }) => {
    const ts = Date.now();
    const playerDocs = await ctx.db
      .query('players')
      .withIndex('by_worldId', (q) => q.eq('worldId', worldId))
      .collect();
    // Make snapshot of world
    const playerSnapshots = await asyncMap(playerDocs, async (playerDoc) =>
      playerSnapshot(ctx.db, playerDoc, ts),
    );

    // TODO: If the player's path is blocked, stop or re-route.
    // TODO: ensure one action running per player
    // TODO: coordinate shared interactions (shared focus)
    // TODO: Determine if any players are not worth waking up

    const snapshots = await asyncMap(playerSnapshots, async (playerSnapshot) =>
      makeSnapshot(ctx.db, playerSnapshot, playerSnapshots, ts),
    );
    // For each player (oldest to newest? Or all on the same step?):
    for (const snapshot of snapshots) {
      // For players worth waking up: schedule action
      if (oneShot && snapshot.player.id !== oneShot) continue;
      await ctx.db.insert('journal', {
        ts,
        playerId: snapshot.player.id,
        data: {
          type: 'planning',
          snapshot,
        },
      });
      await ctx.scheduler.runAfter(0, internal.agent.runAgent, { snapshot });
      // TODO: handle timeouts
      // Later: handle object ownership?
    }
    if (oneShot) return;
    // TODO: recursively schedule mutation
  },
});

export const getPlayerSnapshot = query({
  args: { playerId: v.id('players'), tsOffset: v.optional(v.number()) },
  handler: async (ctx, args) => {
    // TODO: how to fetch the latest always, not cache Date.now()?
    // For now, use a big tsOffset.
    const ts = Date.now() + (args.tsOffset ?? Infinity);
    const playerDoc = (await ctx.db.get(args.playerId))!;
    const player = await playerSnapshot(ctx.db, playerDoc, ts);
    // Could potentially do a smarter filter in the future to only get
    // players that are nearby, but for now, just get all of them.
    const allPlayers = await asyncMap(
      await ctx.db
        .query('players')
        .withIndex('by_worldId', (q) => q.eq('worldId', playerDoc.worldId))
        .collect(),
      (playerDoc) => playerSnapshot(ctx.db, playerDoc, ts),
    );
    const snapshot = await makeSnapshot(ctx.db, player, allPlayers, ts);
    // We fetch at ts===Infinity to get the latest
    return { ...snapshot, ts: ts === Infinity ? Date.now() : ts };
  },
});

export async function handlePlayerAction(
  ctx: MutationCtx,
  { playerId, action }: { playerId: Id<'players'>; action: Action },
) {
  const ts = Date.now();
  let nextActionTs = ts + DEFAULT_AGENT_IDLE;
  const playerDoc = (await ctx.db.get(playerId))!;
  const { worldId } = playerDoc;
  const player = await playerSnapshot(ctx.db, playerDoc, ts);
  // TODO: Check if the player shoudl still respond.
  switch (action.type) {
    case 'startConversation':
      // TODO: determine if other players are still available.
      const conversationId = await ctx.db.insert('conversations', { worldId });
      await ctx.db.insert('journal', {
        ts,
        playerId,
        data: {
          type: 'talking',
          audience: action.audience,
          content: action.content,
          conversationId,
        },
      });
      // TODO: schedule other players to be woken up if they aren't already.
      break;
    case 'saySomething':
      // TODO: Check if these players are still nearby?
      await ctx.db.insert('journal', {
        ts,
        playerId,
        data: {
          type: 'talking',
          audience: action.audience,
          content: action.content,
          conversationId: action.conversationId,
        },
      });
      // TODO: schedule other users to be woken up if they aren't already.
      break;
    case 'travel':
      // TODO: calculate obstacles to wake up?
      const { route, distance } = await findRoute(player.pose, action.position);
      // TODO: Scan for upcoming collisions (including objects for new observations)
      const targetEndTs = ts + distance * TIME_PER_STEP;
      nextActionTs = Math.min(nextActionTs, targetEndTs);
      await ctx.db.insert('journal', {
        ts,
        playerId,
        data: {
          type: 'walking',
          route,
          targetEndTs,
        },
      });
      break;
    case 'continue':
      await ctx.db.insert('journal', {
        ts,
        playerId,
        data: {
          type: 'continuing',
        },
      });
      break;
  }
  await ctx.scheduler.runAt(nextActionTs, internal.engine.tick, { worldId });
}

async function makeSnapshot(
  db: DatabaseReader,
  player: Player,
  otherPlayersAndMe: Player[],
  ts: GameTs,
): Promise<Snapshot> {
  const status = await getStatus(db, player.id, ts);
  const lastPlan = await latestEntryOfType(db, player.id, 'planning', ts);
  const lastPlanTs = lastPlan?.ts ?? 0;
  const otherPlayers = otherPlayersAndMe.filter((d) => d.id !== player.id);
  const nearbyPlayers = getNearbyPlayers(db, player, otherPlayers, lastPlanTs).map((player) => ({
    player,
    new: !lastPlan?.data.snapshot.nearbyPlayers.find((a) => a.player.id === player.id),
  }));
  const planEntry = (await latestMemoryOfType(db, player.id, 'plan', ts))!;
  return {
    player,
    status,
    plan: planEntry.description,
    nearbyPlayers,
  };
}

async function playerSnapshot(
  db: DatabaseReader,
  playerDoc: Doc<'players'>,
  ts: GameTs,
): Promise<Player> {
  const lastStop = await latestEntryOfType(db, playerDoc._id, 'stopped', ts);
  const lastWalk = await latestEntryOfType(db, playerDoc._id, 'walking', ts);
  const pose: Pose = calculatePose(lastStop, lastWalk, ts);
  const identity = await fetchIdentity(db, playerDoc._id, ts);

  return { id: playerDoc._id, name: playerDoc.name, identity, pose };
}

function getNearbyPlayers(
  db: DatabaseReader,
  target: Player,
  others: Player[],
  lastPlanTs: GameTs,
) {
  return others.filter((a) => {
    const distance = manhattanDistance(target.pose.position, a.pose.position);
    return distance < NEARBY_DISTANCE;
  });
}

async function getStatus(db: DatabaseReader, playerId: Id<'players'>, ts: GameTs): Promise<Status> {
  const lastTalk = await latestEntryOfType(db, playerId, 'talking', ts);
  const lastStop = await latestEntryOfType(db, playerId, 'stopped', ts);
  const lastWalk = await latestEntryOfType(db, playerId, 'walking', ts);
  const lastPlan = await latestEntryOfType(db, playerId, 'planning', ts);
  const lastContinue = await latestEntryOfType(db, playerId, 'continuing', ts);
  const stack = pruneNull([lastTalk, lastStop, lastWalk, lastPlan, lastContinue]).sort(
    (a, b) => a.ts - b.ts,
  );
  // Special base case for before player has other entries.
  if (stack.length > 0) {
    let latest = stack.pop()!;
    if (latest.data.type === 'continuing') {
      const next = stack.pop()!;
      if (next.data.type === 'planning') {
        // The planning decided to continue as previously planned.
        latest = stack.pop()!;
      } else {
        latest = next;
      }
    }
    const latestData = latest.data;
    switch (latestData.type) {
      case 'talking':
        const messages = await fetchMessages(db, latestData.conversationId);
        const lastMessage = messages.at(-1)!;
        return {
          type: 'talking',
          otherPlayerIds: lastMessage.data.audience,
          conversationId: latestData.conversationId,
          messages: messages.map((m) => ({
            from: m.playerId,
            to: m.data.audience,
            content: m.data.content,
          })),
        };
      case 'walking':
        return {
          type: 'walking',
          sinceTs: latest.ts,
          route: latestData.route,
          targetEndTs: latestData.targetEndTs,
        };
      case 'stopped':
        return {
          type: 'stopped',
          reason: latestData.reason,
          sinceTs: latest.ts,
        };
      case 'planning':
        return {
          type: 'thinking',
          sinceTs: latest.ts,
        };
    }
  }
  return { type: 'stopped', sinceTs: ts, reason: 'idle' };
}

async function fetchPose(db: DatabaseReader, playerId: Id<'players'>, ts: GameTs): Promise<Pose> {
  const lastStop = await latestEntryOfType(db, playerId, 'stopped', ts);
  const lastWalk = await latestEntryOfType(db, playerId, 'walking', ts);
  return calculatePose(lastStop, lastWalk, ts);
}

async function fetchIdentity(
  db: DatabaseReader,
  playerId: Id<'players'>,
  ts: GameTs,
): Promise<string> {
  const identityEntry = (await latestMemoryOfType(db, playerId, 'identity', ts))!;
  return identityEntry.description;
}

async function fetchMessages(db: DatabaseReader, conversationId: Id<'conversations'>) {
  const messageEntries = await db
    .query('journal')
    .withIndex('by_conversation', (q) => q.eq('data.conversationId', conversationId as any))
    .collect();
  return messageEntries as EntryOfType<'talking'>[];
}

function calculatePose(
  lastStop: EntryOfType<'stopped'> | null,
  lastWalk: EntryOfType<'walking'> | null,
  ts: GameTs,
): Pose {
  if (!lastWalk) {
    if (!lastStop) {
      return { position: DEFAULT_START_POS, orientation: 0 };
    }
    return lastStop.data.pose;
  }
  if (!lastStop || lastWalk.ts > lastStop.ts) {
    // Calculate based on walk
    const fraction = calculateFraction(lastWalk.ts, lastWalk.data.targetEndTs, ts);
    return getPoseFromRoute(lastWalk.data.route, fraction);
  }
  return lastStop.data.pose;
}

async function latestEntryOfType<T extends EntryType>(
  db: DatabaseReader,
  playerId: Id<'players'>,
  type: T,
  ts: GameTs,
) {
  const entry = await db
    .query('journal')
    .withIndex('by_playerId_type_ts', (q) =>
      q.eq('playerId', playerId).eq('data.type', type).lte('ts', ts),
    )
    .order('desc')
    .first();
  if (!entry) return null;
  return entry as EntryOfType<T>;
}

async function latestMemoryOfType<T extends MemoryType>(
  db: DatabaseReader,
  playerId: Id<'players'>,
  type: T,
  ts: GameTs,
) {
  const entry = await db
    .query('memories')
    .withIndex('by_playerId_type_ts', (q) =>
      q.eq('playerId', playerId).eq('data.type', type).lte('ts', ts),
    )
    .order('desc')
    .first();
  if (!entry) return null;
  return entry as MemoryOfType<T>;
}

// function getPlayerStatus(entries: Entry[] /* latest first */): Status {}
