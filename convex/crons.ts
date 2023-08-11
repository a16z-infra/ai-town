import { cronJobs } from 'convex/server';
import { internalMutation } from './_generated/server';
import { getLatestPlayerMotion } from './journal';
import {
  AGENT_THINKING_TOO_LONG,
  VACUUM_BATCH_SIZE,
  VACUUM_JOURNAL_AGE,
  VACUUM_MEMORIES_AGE,
} from './config';
import { enqueueAgentWake } from './engine';
import { internal } from './_generated/api';
import { TableNames } from './_generated/dataModel';

export const recoverThinkingAgents = internalMutation({
  args: {},
  handler: async (ctx, args) => {
    const world = await ctx.db.query('worlds').order('desc').first();
    if (!world) throw new Error('No world found');
    // Future: we can check all players, but for now just the most recent world.
    const ts = Date.now();
    const agentDocs = await ctx.db
      .query('agents')
      .withIndex('by_worldId_thinking', (q) => q.eq('worldId', world._id).eq('thinking', true))
      .filter((q) => q.lt(q.field('lastWakeTs'), Date.now() - AGENT_THINKING_TOO_LONG))
      .collect();
    if (agentDocs.length !== 0) {
      // We can just enqueue one, since they're all at the same time.
      const scheduled = await enqueueAgentWake(ctx, agentDocs[0]._id, world._id, ts);
      for (const agentDoc of agentDocs) {
        console.error(`Agent ${agentDoc._id} was thinking too long. Resetting`);
        await ctx.db.patch(agentDoc._id, {
          thinking: false,
          nextWakeTs: ts,
          scheduled,
        });
      }
    }
  },
});

// Allow 1s for a character to start moving after ending a walk.
const BUFFER = 1_000;
export const recoverStoppedAgents = internalMutation({
  args: {},
  handler: async (ctx, args) => {
    const world = await ctx.db.query('worlds').order('desc').first();
    if (!world) throw new Error('No world found');
    if (world.frozen) {
      console.debug("Didn't tick: world frozen");
      return;
    }
    // Future: we can check all players, but for now just the most recent world.
    const agentDocs = await ctx.db
      .query('agents')
      .withIndex('by_worldId_thinking', (q) => q.eq('worldId', world._id).eq('thinking', false))
      .collect();
    for (const agentDoc of agentDocs) {
      const motion = await getLatestPlayerMotion(ctx.db, agentDoc.playerId);
      if (motion.type === 'walking' && motion.targetEndTs < Date.now() - BUFFER) {
        console.error("We found a stationary agent that's not thinking. Tick time");
        await enqueueAgentWake(ctx, agentDoc._id, world._id, Date.now());
        return;
      }
    }
  },
});

export const vacuumOldEntries = internalMutation({
  handler: async (
    ctx,
    {
      table,
      age,
      ...args
    }: {
      table: TableNames;
      untilTs?: number;
      age: number;
      cursor: null | string;
      soFar: number;
    },
  ) => {
    const untilTs = args.untilTs ?? Date.now() - age;
    const results = await ctx.db
      .query(table)
      .withIndex('by_creation_time', (q) => q.lt('_creationTime', untilTs))
      .paginate({ cursor: args.cursor, numItems: VACUUM_BATCH_SIZE });
    for (const doc of results.page) {
      await ctx.db.delete(doc._id);
    }
    if (results.isDone) {
      console.debug(`Vacuumed ${results.page.length} old ${table} entries.`);
    } else {
      await ctx.scheduler.runAfter(0, internal.crons.vacuumOldEntries, {
        table,
        untilTs,
        age,
        cursor: results.continueCursor,
        soFar: args.soFar + results.page.length,
      });
    }
  },
});

const crons = cronJobs();
crons.interval('restart idle agents', { seconds: 60 }, internal.crons.recoverStoppedAgents);
crons.interval('restart thinking agents', { seconds: 60 }, internal.crons.recoverThinkingAgents);
crons.interval('vacuum old journal entries', { hours: 1 }, internal.crons.vacuumOldEntries, {
  table: 'journal',
  age: VACUUM_JOURNAL_AGE,
  cursor: null,
  soFar: 0,
});
crons.interval('vacuum old memory entries', { hours: 6 }, internal.crons.vacuumOldEntries, {
  table: 'memories',
  age: VACUUM_MEMORIES_AGE,
  cursor: null,
  soFar: 0,
});
export default crons;
