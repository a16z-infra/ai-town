import { v } from 'convex/values';
import { internal } from './_generated/api';
import { Doc, Id } from './_generated/dataModel';
import {
  DatabaseReader,
  DatabaseWriter,
  MutationCtx,
  QueryCtx,
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server';
import {
  GameTs,
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
import { findRoute, getPoseFromMotion, manhattanDistance, roundPose } from './lib/physics.js';
import { clientMessage } from './chat';

export const NEARBY_DISTANCE = 5;
export const TIME_PER_STEP = 1000;
export const DEFAULT_AGENT_IDLE = 30_000;
// If you don't set a start position, you'll start at 0,0.
export const DEFAULT_START_POSE: Pose = { position: { x: 0, y: 0 }, orientation: 0 };
export const CONVERSATION_DEAD_THRESHOLD = 600_000; // In ms

// TODO: add a cron to tick every minute or so
export const tick = internalMutation({
  args: { worldId: v.id('worlds'), forPlayer: v.optional(v.id('players')) },
  handler: async (ctx, { worldId, forPlayer }) => {
    const ts = Date.now();
    const playerDocs = await ctx.db
      .query('players')
      .withIndex('by_worldId', (q) => q.eq('worldId', worldId))
      .collect();
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
      if (forPlayer && player.id !== forPlayer) continue;

      // TODO: If the player's path is blocked, stop or re-route.
      // If the player has arrived at their destination, update it.
      if (player.motion.type === 'walking' && player.motion.targetEndTs <= ts) {
        const motion = {
          type: 'stopped',
          reason: 'idle',
          pose: roundPose(getPoseFromMotion(player.motion, ts)),
        } as Motion;
        await ctx.db.insert('journal', {
          ts,
          playerId: player.id,
          data: motion,
        });
        // Give the snapshot the latest player state.
        // A bit hacky, we could re-create the player state, but fine for now.
        player.motion = motion;
      }

      // TODO: Determine if any players are not worth waking up
      const snapshot = await makeSnapshot(ctx.db, player, playerSnapshots);
      // We mark ourselves as planning AFTER the snapshot, so the snapshot can
      // access the previous plan.
      await ctx.db.insert('journal', {
        ts,
        playerId: snapshot.player.id,
        data: {
          type: 'planning',
          snapshot,
        },
      });
      // Fetch the new state
      const playerDoc = playerDocs.find((d) => d._id === player.id)!;
      // Replace it for other players.
      playerSnapshots[idx] = await getPlayer(ctx.db, playerDoc);
      // For players worth waking up: schedule action
      await ctx.scheduler.runAfter(0, internal.agent.runAgent, { snapshot });
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
  const allPlayers = await asyncMap(
    await ctx.db
      .query('players')
      .withIndex('by_worldId', (q) => q.eq('worldId', playerDoc.worldId))
      .collect(),
    (playerDoc) => getPlayer(ctx.db, playerDoc),
  );
  const snapshot = await makeSnapshot(ctx.db, player, allPlayers);
  return snapshot;
}

export const getPlayerSnapshot = query({
  args: { playerId: v.id('players') },
  handler: async (ctx, args) => {
    const playerDoc = (await ctx.db.get(args.playerId))!;
    const player = await getPlayer(ctx.db, playerDoc);
    return player;
  },
});

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
  const tick = async (at?: number, forPlayer?: Id<'players'>) => {
    if (noSchedule) return;
    if (at) ctx.scheduler.runAt(at, internal.engine.tick, { worldId, forPlayer });
    else ctx.scheduler.runAfter(0, internal.engine.tick, { worldId, forPlayer });
  };
  const ts = Date.now();
  const playerDoc = (await ctx.db.get(playerId))!;
  const { worldId } = playerDoc;
  const player = await getPlayer(ctx.db, playerDoc);
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
      const { route, distance } = findRoute(player.motion, action.position, ts);
      // TODO: Scan for upcoming collisions (including objects for new observations)
      const targetEndTs = ts + distance * TIME_PER_STEP;
      await ctx.db.insert('journal', {
        ts,
        playerId,
        data: { type: 'walking', route, startTs: ts, targetEndTs },
      });
      tick(targetEndTs, playerId);
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
  return true;
}

async function makeSnapshot(
  db: DatabaseReader,
  player: Player,
  otherPlayersAndMe: Player[],
): Promise<Snapshot> {
  const lastPlan = await latestEntryOfType(db, player.id, 'planning');
  const otherPlayers = otherPlayersAndMe.filter((d) => d.id !== player.id);
  const nearbyPlayers = await asyncMap(getNearbyPlayers(player, otherPlayers), async (other) => ({
    player: other,
    relationship:
      (await latestRelationshipMemoryWith(db, player.id, other.id))?.description ??
      `${player.name} doesn't know ${other.name}`,
    new: !lastPlan?.data.snapshot.nearbyPlayers.find((a) => a.player.id === other.id),
  }));
  const planEntry = await latestMemoryOfType(db, player.id, 'plan');
  return {
    player,
    lastPlan: planEntry ? { plan: planEntry.description, ts: planEntry.ts } : undefined,
    nearbyPlayers,
    nearbyConversations: await getNearbyConversations(
      db,
      player.id,
      otherPlayersAndMe.map(({ id }) => id),
    ),
  };
}

async function getPlayer(db: DatabaseReader, playerDoc: Doc<'players'>): Promise<Player> {
  const lastPlan = await latestEntryOfType(db, playerDoc._id, 'planning');
  const lastContinue = await latestEntryOfType(db, playerDoc._id, 'continuing');
  const lastThinking = pruneNull([lastPlan, lastContinue])
    .sort((a, b) => a.ts - b.ts)
    .pop();
  const lastStop = await latestEntryOfType(db, playerDoc._id, 'stopped');
  const lastWalk = await latestEntryOfType(db, playerDoc._id, 'walking');
  const lastChat = await latestEntryOfType(db, playerDoc._id, 'talking');
  const latestMotion = pruneNull([lastStop, lastWalk])
    .sort((a, b) => a.ts - b.ts)
    .pop()?.data;
  const identityEntry = await latestMemoryOfType(db, playerDoc._id, 'identity');
  const identity = identityEntry?.description ?? 'I am a person.';

  return {
    id: playerDoc._id,
    name: playerDoc.name,
    identity,
    thinking: lastThinking?.data.type === 'planning',
    lastSpokeTs: lastChat?.ts ?? 0,
    motion: latestMotion ?? { type: 'stopped', reason: 'idle', pose: DEFAULT_START_POSE },
  };
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
    .filter((entry) => Date.now() - entry.ts < CONVERSATION_DEAD_THRESHOLD)
    // Get the latest message for each conversation, keyed by conversationId.
    .reduce<Record<Id<'conversations'>, EntryOfType<'talking'>>>((convos, entry) => {
      const existing = convos[entry.data.conversationId];
      if (!existing || existing.ts < entry.ts) {
        convos[entry.data.conversationId] = entry;
      }
      return convos;
    }, {});
  // Now, filter out conversations that did't include the observer.
  const conversations = Object.values(conversationsById).filter(
    (entry) => entry.data.audience.includes(playerId) || entry.playerId === playerId,
  );
  return (
    await asyncMap(conversations, async (entry) => ({
      conversationId: entry.data.conversationId,
      messages: (await fetchMessages(db, entry.data.conversationId))
        .map(clientMessage)
        .filter((message) => message.to.includes(playerId) || message.from === playerId),
    }))
  ).filter((c) => c.messages.length > 0);
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
) {
  const entry = await db
    .query('journal')
    .withIndex('by_playerId_type_ts', (q) => q.eq('playerId', playerId).eq('data.type', type))
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
    .withIndex('by_playerId_type_ts', (q) => q.eq('playerId', playerId).eq('data.type', type))
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
    .withIndex('by_playerId_type_ts', (q) =>
      q.eq('playerId', playerId).eq('data.type', 'relationship'),
    )
    .order('desc')
    .filter((q) => q.eq(q.field('data.playerId'), otherPlayerId))
    .first();
  if (!entry) return null;
  return entry as MemoryOfType<'relationship'>;
}

// function getPlayerStatus(entries: Entry[] /* latest first */): Status {}
