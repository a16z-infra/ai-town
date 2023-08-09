import { v } from 'convex/values';
import { internal } from './_generated/api';
import { Doc, Id } from './_generated/dataModel';
import { DatabaseReader, DatabaseWriter, internalMutation } from './_generated/server';
import { WORLD_IDLE_THRESHOLD } from './config';
import { asyncMap, pruneNull } from './lib/utils';

export const tick = internalMutation({
  args: { worldId: v.id('worlds'), agentIds: v.optional(v.array(v.id('agents'))) },
  handler: async (ctx, { worldId, agentIds }) => {
    const ts = Date.now();
    // Fetch the first recent heartbeat.
    if (!(await getRecentHeartbeat(ctx.db, worldId))) {
      console.log("Didn't tick: no heartbeat recently");
      return;
    }
    const world = await ctx.db.get(worldId);
    if (!world) {
      console.error('No world found');
      return;
    }
    if (world.frozen) {
      console.log("Didn't tick: world frozen");
      return;
    }

    // Fetch agents to wake up: not already thinking
    // TODO: only fetch agentIds if specified
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
      const firstToWake = agentDocs.find((a) => !!a.nextWakeTs);
      if (firstToWake && !firstToWake.scheduled) {
        console.log('Scheduling for the next agent');
        await ctx.scheduler.runAt(firstToWake.nextWakeTs!, internal.engine.tick, {
          worldId,
          agentIds: [firstToWake._id, ...firstToWake.alsoWake],
        });
      }
      return;
    }
    const agentIdsToWake = [
      ...new Set([...agentsEagerToWake.flatMap((a) => [a._id, ...a.alsoWake])]),
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
    wakeTs: v.optional(v.number()),
    noSchedule: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Update thinking to false, etc
    // Assert that the agent was thinking
    if (args.noSchedule) {
      console.log(
        `would have scheduled at ${args.wakeTs} for ${args.agentId} and ${args.otherAgentIds}`,
      );
    } else {
      await enqueueAgentWake(ctx.db, args.agentId, args.otherAgentIds, args.wakeTs);
    }
  },
});

export async function enqueueAgentWake(
  db: DatabaseWriter,
  agentId: Id<'agents'>,
  otherAgentIds?: Id<'agents'>[],
  atTs?: number,
) {
  const ts = atTs ?? Date.now();
  const agentDoc = (await db.get(agentId))!;
  const patch = { nextWakeTs: ts, scheduled: true };
  if (agentDoc.nextWakeTs) {
    if (agentDoc.nextWakeTs < ts) {
      console.log(
        `Agent was${agentDoc.scheduled ? '' : ' not'} scheduled to wake up sooner, bumping out.`,
      );

      return;
    }
  }
  // TODO: finish impl
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
