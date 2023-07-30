import { v } from 'convex/values';
import { internal } from './_generated/api';
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
import { GameTs, EntryType, EntryOfType, MemoryOfType, MemoryType } from './schema';
import { Action, Player, Pose, Snapshot } from './types.js';
import { asyncMap, pruneNull } from './lib/utils.js';
import { findRoute, getPoseFromMotion, manhattanDistance, roundPose } from './lib/physics.js';

export const NEARBY_DISTANCE = 5;
export const TIME_PER_STEP = 1000;
export const DEFAULT_AGENT_IDLE = 30_000;
// If you don't set a start position, you'll start at 0,0.
export const DEFAULT_START_POSE: Pose = { position: { x: 0, y: 0 }, orientation: 0 };
export const CONVERSATION_DEAD_THRESHOLD = 600_000; // In ms

// TODO: add a cron to tick every minute or so
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
      // TODO: if the player hasn't finished for a long time,
      // try anyways and handle rejecting old actions.
      if (snapshot.player.thinking) continue;
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
      // TODO: try to avoid them talking over each other.
      await ctx.scheduler.runAfter(0, internal.agent.runAgent, { snapshot });
      // TODO: handle timeouts
      // Later: handle object ownership?
    }
    if (oneShot) return;
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
    return snapshot;
  },
});

export const handleAgentAction = internalMutation({
  args: { playerId: v.id('players'), action: Action, oneShot: v.optional(v.boolean()) },
  handler: handlePlayerAction,
});

export async function handlePlayerAction(
  ctx: MutationCtx,
  { playerId, action, oneShot }: { playerId: Id<'players'>; action: Action; oneShot?: boolean },
) {
  const tick = async (at?: number) => {
    if (oneShot) return;
    if (at) ctx.scheduler.runAt(at, internal.engine.tick, { worldId });
    else ctx.scheduler.runAfter(0, internal.engine.tick, { worldId });
  };
  const ts = Date.now();
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
          // TODO: just limit to who's around.
          audience: action.audience,
          content: action.content,
          conversationId,
        },
      });
      tick();
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
      await tick();
      break;
    case 'travel':
      // TODO: calculate obstacles to wake up?
      const { route, distance } = await findRoute(player.motion, action.position);
      // TODO: Scan for upcoming collisions (including objects for new observations)
      const targetEndTs = ts + distance * TIME_PER_STEP;
      await ctx.db.insert('journal', {
        ts,
        playerId,
        data: { type: 'walking', route, startTs: ts, targetEndTs },
      });
      tick(targetEndTs);
      break;
    case 'continue':
      await ctx.db.insert('journal', { ts, playerId, data: { type: 'continuing' } });
      break;
    case 'stop':
      await ctx.db.insert('journal', {
        ts,
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
  }
}

async function makeSnapshot(
  db: DatabaseReader,
  player: Player,
  otherPlayersAndMe: Player[],
  ts: GameTs,
): Promise<Snapshot> {
  const lastPlan = await latestEntryOfType(db, player.id, 'planning', ts);
  const otherPlayers = otherPlayersAndMe.filter((d) => d.id !== player.id);
  const nearbyPlayers = getNearbyPlayers(db, player, otherPlayers, ts).map((player) => ({
    player,
    new: !lastPlan?.data.snapshot.nearbyPlayers.find((a) => a.player.id === player.id),
  }));
  const planEntry = await latestMemoryOfType(db, player.id, 'plan', ts);
  return {
    player,
    lastPlan: planEntry ? { plan: planEntry.description, ts: planEntry.ts } : undefined,
    nearbyPlayers,
    nearbyConversations: await getNearbyConversations(
      db,
      player.id,
      otherPlayersAndMe.map(({ id }) => id),
      ts,
    ),
  };
}

async function playerSnapshot(
  db: DatabaseReader,
  playerDoc: Doc<'players'>,
  ts: GameTs,
): Promise<Player> {
  const lastPlan = await latestEntryOfType(db, playerDoc._id, 'planning', ts);
  const lastContinue = await latestEntryOfType(db, playerDoc._id, 'continuing', ts);
  const lastThinking = pruneNull([lastPlan, lastContinue])
    .sort((a, b) => b.ts - a.ts)
    .pop();
  const lastStop = await latestEntryOfType(db, playerDoc._id, 'stopped', ts);
  const lastWalk = await latestEntryOfType(db, playerDoc._id, 'walking', ts);
  const latestMotion = pruneNull([lastStop, lastWalk])
    .sort((a, b) => b.ts - a.ts)
    .pop()?.data;
  const identity = await fetchIdentity(db, playerDoc._id, ts);

  return {
    id: playerDoc._id,
    name: playerDoc.name,
    identity,
    thinking: lastThinking?.data.type === 'planning',
    motion: latestMotion ?? { type: 'stopped', reason: 'idle', pose: DEFAULT_START_POSE },
  };
}

function getNearbyPlayers(db: DatabaseReader, target: Player, others: Player[], ts: GameTs) {
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
  ts: GameTs,
): Promise<Snapshot['nearbyConversations']> {
  const conversationsById = pruneNull(
    await asyncMap(
      playerIds,
      async (playerId) => await latestEntryOfType(db, playerId, 'talking', ts),
    ),
  )
    // Filter out old conversations
    .filter((entry) => entry.ts < CONVERSATION_DEAD_THRESHOLD)
    // Get the latest message for each conversation.
    .reduce<Record<Id<'conversations'>, EntryOfType<'talking'>>>((convos, entry) => {
      const existing = convos[entry.data.conversationId];
      if (!existing || existing.ts < entry.ts) {
        convos[entry.data.conversationId] = entry;
      }
      return convos;
    }, {});
  // Now, filter out conversations that did't include the observer.
  const conversations = Object.values(conversationsById).filter((entry) => {
    return !!entry.data.audience.indexOf(playerId);
  });
  return asyncMap(conversations, async (entry) => ({
    conversationId: entry.data.conversationId,
    messages: (await fetchMessages(db, entry.data.conversationId)).map((m) => ({
      from: m.playerId,
      to: m.data.audience,
      content: m.data.content,
      ts: m.ts,
    })),
  }));
}

async function fetchIdentity(
  db: DatabaseReader,
  playerId: Id<'players'>,
  ts: GameTs,
): Promise<string> {
  const identityEntry = await latestMemoryOfType(db, playerId, 'identity', ts);
  return identityEntry?.description ?? 'I am a person.';
}

async function fetchMessages(db: DatabaseReader, conversationId: Id<'conversations'>) {
  const messageEntries = await db
    .query('journal')
    .withIndex('by_conversation', (q) => q.eq('data.conversationId', conversationId as any))
    .collect();
  return messageEntries as EntryOfType<'talking'>[];
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
