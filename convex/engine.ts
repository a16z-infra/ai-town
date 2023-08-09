import { v } from 'convex/values';
import { internal } from './_generated/api';
import { Doc, Id } from './_generated/dataModel';
import { DatabaseReader, DatabaseWriter, MutationCtx, internalMutation } from './_generated/server';
import { WORLD_IDLE_THRESHOLD } from './config';
import { asyncMap, pruneNull } from './lib/utils';

export const tick = internalMutation({
  args: { worldId: v.id('worlds') },
  handler: async (ctx, { worldId }) => {
    const ts = Date.now();
    // Fetch the first recent heartbeat.
    if (!(await getRecentHeartbeat(ctx.db, worldId))) {
      console.log("Didn't tick: no heartbeat recently");
      return;
    }
    const world = await ctx.db.get(worldId);
    if (!world) {
      console.error("Didn't tick: No world found");
      return;
    }
    if (world.frozen) {
      console.log("Didn't tick: world frozen");
      return;
    }

    // Fetch agents to wake up: not already thinking
    const agentDocs = await ctx.db
      .query('agents')
      .withIndex(
        'by_worldId_thinking',
        (q) => q.eq('worldId', worldId).eq('thinking', false),
        // TODO: try to limit to just the users who need waking:
        // .lte('nextWakeTs', ts)
      )
      .collect();
    if (!agentDocs.length) {
      console.log("Didn't tick: all agents thinking");
      return;
    }
    const agentsEagerToWake = agentDocs.filter((a) => a.nextWakeTs && a.nextWakeTs <= ts);
    if (!agentsEagerToWake.length) {
      console.log("Didn't tick: spurious, no agents eager to wake up");
      const firstToWake = agentDocs[0];
      if (firstToWake && !firstToWake.scheduled) {
        console.log('Scheduling for the next agent');
        await ctx.db.patch(firstToWake._id, { scheduled: true });
        await ctx.scheduler.runAt(firstToWake.nextWakeTs, internal.engine.tick, {
          worldId,
        });
      }
      return;
    }
    const agentIdsToWake = [
      ...new Set([...agentsEagerToWake.flatMap((a) => [a._id, ...(a.alsoWake ?? [])])]),
    ];
    const agentsToWake = pruneNull(await asyncMap(agentIdsToWake, ctx.db.get)).filter(
      (a) => !a.thinking,
    );
    for (const agentDoc of agentsToWake) {
      const patch: Partial<Doc<'agents'>> = { thinking: true, lastWakeTs: ts };
      if (agentDoc.nextWakeTs && agentDoc.nextWakeTs <= ts) {
        // Reset their desired wake state.
        patch.nextWakeTs = undefined;
        patch.alsoWake = [];
        patch.scheduled = false;
      }
      await ctx.db.patch(agentDoc._id, patch);
    }
    const playerIds = agentsToWake.map((a) => a.playerId);
    console.log('Running agents for players: ', playerIds);
    await ctx.scheduler.runAfter(0, internal.agent.runAgentBatch, { playerIds });
    // TODO: handle timeouts
    // Later: handle object ownership?
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
    await ctx.db.replace(args.agentId, {
      playerId: agentDoc.playerId,
      worldId: agentDoc.worldId,
      thinking: false,
      lastWakeTs: agentDoc.nextWakeTs,
      nextWakeTs: args.wakeTs,
      alsoWake: args.otherAgentIds,
      scheduled: await enqueueAgentWake(
        ctx,
        args.agentId,
        agentDoc.worldId,
        args.wakeTs,
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
      console.log('Not scheduling: next scheduled is at the same time: ', nextScheduled.nextWakeTs);
      return true;
    }
    // Another agent will be scheduled before us
    if (nextScheduled._id !== agentId) {
      console.log('Not scheduling: next scheduled agent is before us: ', nextScheduled.nextWakeTs);
      return false;
    }
  }
  if (noSchedule) return false;
  console.log('Scheduling for ', atTs);
  await ctx.scheduler.runAt(atTs, internal.engine.tick, { worldId });
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
