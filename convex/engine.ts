import { v } from 'convex/values';
import { internal } from './_generated/api';
import { Doc, Id } from './_generated/dataModel';
import { DatabaseReader, DatabaseWriter, MutationCtx, internalMutation } from './_generated/server';
import { TICK_DEBOUNCE, WORLD_IDLE_THRESHOLD } from './config';
import { asyncMap, pruneNull } from './lib/utils';

export const tick = internalMutation({
  args: { worldId: v.id('worlds'), noSchedule: v.optional(v.boolean()) },
  handler: async (ctx, { worldId, noSchedule }) => {
    const ts = Date.now();
    // Fetch the first recent heartbeat.
    if (!(await getRecentHeartbeat(ctx.db, worldId))) {
      console.debug("Didn't tick: no heartbeat recently");
      return;
    }
    const world = await ctx.db.get(worldId);
    if (!world) throw new Error("Didn't tick: No world found");
    if (world.frozen && !noSchedule) throw new Error("Didn't tick: world frozen");

    // Fetch agents to wake up: not already thinking
    const agentDocs = await ctx.db
      .query('agents')
      .withIndex('by_worldId_thinking', (q) => q.eq('worldId', worldId).eq('thinking', false))
      .collect();
    if (!agentDocs.length) {
      console.debug("Didn't tick: all agents thinking");
      return;
    }
    const agentsEagerToWake = agentDocs.filter((a) => a.nextWakeTs && a.nextWakeTs <= ts);
    const agentIdsToWake = new Set([
      ...agentsEagerToWake.flatMap((a) => [a._id, ...(a.alsoWake ?? [])]),
    ]);
    const nextToWake = agentDocs.find((a) => !agentIdsToWake.has(a._id) && a.nextWakeTs > ts);
    if (nextToWake && !nextToWake.scheduled) {
      await ctx.db.patch(nextToWake._id, { scheduled: true });
      await ctx.scheduler.runAt(nextToWake.nextWakeTs, internal.engine.tick, {
        worldId,
      });
    }
    if (!agentsEagerToWake.length) {
      console.debug("Didn't tick: spurious, no agents eager to wake up");
      return;
    }
    const agentsToWake = pruneNull(await asyncMap(agentIdsToWake, ctx.db.get)).filter(
      (a) => !a.thinking,
    );
    for (const agentDoc of agentsToWake) {
      await ctx.db.patch(agentDoc._id, { thinking: true, lastWakeTs: ts });
    }
    const playerIds = agentsToWake.map((a) => a.playerId);
    await ctx.scheduler.runAfter(0, internal.agent.runAgentBatch, { playerIds, noSchedule });
  },
});

async function getRecentHeartbeat(db: DatabaseReader, worldId: Id<'worlds'>) {
  return (
    db
      .query('heartbeats')
      // Tip: by fetching heartbeats this way, the transaction doesn't conflict
      // with new heartbeats being added, assuming it wasn't the first heartbeat
      .withIndex('by_creation_time', (q) =>
        q.gt('_creationTime', Date.now() - WORLD_IDLE_THRESHOLD),
      )
      .first()
  );
}

export const agentDone = internalMutation({
  args: {
    agentId: v.id('agents'),
    otherAgentIds: v.optional(v.array(v.id('agents'))),
    wakeTs: v.number(),
    noSchedule: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const agentDoc = await ctx.db.get(args.agentId);
    if (!agentDoc) throw new Error(`Agent ${args.agentId} not found`);
    if (!agentDoc.thinking) {
      throw new Error('Agent was not thinking: did you call agentDone twice for the same agent?');
    }

    const nextWakeTs = Math.ceil(args.wakeTs / TICK_DEBOUNCE) * TICK_DEBOUNCE;
    await ctx.db.replace(args.agentId, {
      playerId: agentDoc.playerId,
      worldId: agentDoc.worldId,
      thinking: false,
      lastWakeTs: agentDoc.nextWakeTs,
      nextWakeTs,
      alsoWake: args.otherAgentIds,
      scheduled: await enqueueAgentWake(
        ctx,
        args.agentId,
        agentDoc.worldId,
        nextWakeTs,
        args.noSchedule,
      ),
    });
  },
});

export async function enqueueAgentWake(
  ctx: MutationCtx,
  agentId: Id<'agents'>,
  worldId: Id<'worlds'>,
  atTs: number,
  noSchedule?: boolean,
) {
  // Future: Debounce wakups by looking 100ms into the future.
  const nextScheduled = await ctx.db
    .query('agents')
    .withIndex('by_worldId_thinking', (q) =>
      q.eq('worldId', worldId).eq('thinking', false).lte('nextWakeTs', atTs),
    )
    .first();
  if (nextScheduled) {
    if (!nextScheduled.scheduled) {
      throw new Error("Next scheduled agent isn't scheduled: " + JSON.stringify(nextScheduled));
    }
    // We are effectively scheduled since it'll wake up at the same time.
    if (nextScheduled.nextWakeTs === atTs) {
      return true;
    }
    // Another agent will be scheduled before us
    if (nextScheduled._id !== agentId) {
      return false;
    }
  }
  if (!noSchedule) await ctx.scheduler.runAt(atTs, internal.engine.tick, { worldId });
  return true;
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

export const unfreeze = internalMutation({
  args: { worldId: v.optional(v.id('worlds')) },
  handler: async (ctx, args) => {
    const world = await ctx.db.query('worlds').order('desc').first();
    if (!world) throw new Error("Didn't unfreeze: No world found");
    await ctx.db.patch(world._id, { frozen: false });
    await ctx.scheduler.runAfter(0, internal.engine.tick, { worldId: world._id });
  },
});
