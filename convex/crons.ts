import { cronJobs } from 'convex/server';
import { internalMutation } from './_generated/server';
import { talkingToUser, getLatestPlayerMotion, latestEntryOfType } from './journal';
import {
  ABANDONED_INTERACTION,
  AGENT_THINKING_TOO_LONG,
  VACUUM_BATCH_SIZE,
  VACUUM_JOURNAL_AGE,
  VACUUM_MEMORIES_AGE,
} from './config';
import { allControlledPlayers, enqueueAgentWake } from './engine';
import { internal } from './_generated/api';
import { TableNames } from './_generated/dataModel';

export const recoverThinkingAgents = internalMutation({
  args: {},
  handler: async (ctx, _args) => {
    const world = await ctx.db.query('worlds').order('desc').first();
    if (!world) throw new Error('No world found');
    // Future: we can check all players, but for now just the most recent world.
    const ts = Date.now();
    const agentDocs = await ctx.db
      .query('agents')
      .withIndex('by_worldId_thinking', (q) => q.eq('worldId', world._id).eq('thinking', true))
      .filter((q) => q.lt(q.field('lastWakeTs'), Date.now() - AGENT_THINKING_TOO_LONG))
      .collect();
    const idleAgents = [];
    for (const agentDoc of agentDocs) {
      // Don't interrupt an agent if they are talking to an active player.
      if (await talkingToUser(ctx.db, agentDoc.playerId)) {
        console.log(`Agent ${agentDoc._id} was thinking too long, but they are talking to a user`);
      } else {
        idleAgents.push(agentDoc);
      }
    }
    if (idleAgents.length !== 0) {
      // We can just enqueue one, since they're all at the same time.
      const scheduled = await enqueueAgentWake(ctx, idleAgents[0]._id, world._id, ts);
      for (const agentDoc of idleAgents) {
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
  handler: async (ctx, _args) => {
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

export const vacuumAbandonedInteractions = internalMutation({
  handler: async (ctx) => {
    const world = await ctx.db.query('worlds').order('desc').first();
    if (!world) throw new Error('No world found');
    if (world.frozen) {
      console.debug("Didn't cleanup: world frozen");
      return;
    }

    const controlledPlayers = await allControlledPlayers(ctx.db, world._id);
    // We consider controlled players to be abandoned if they haven't moved or
    // talked for 30 minutes.
    const cutoff = Date.now() - ABANDONED_INTERACTION;
    for (const player of controlledPlayers) {
      if (player.agentId) {
        continue;
      }
      if (player._creationTime > cutoff) {
        continue;
      }
      const lastMotion = await latestEntryOfType(ctx.db, player._id, 'walking');
      if (lastMotion && lastMotion._creationTime > cutoff) {
        continue;
      }
      const lastTalk = await latestEntryOfType(ctx.db, player._id, 'talking');
      if (lastTalk && lastTalk._creationTime > cutoff) {
        continue;
      }
      await ctx.scheduler.runAfter(0, internal.journal.leaveConversation, { playerId: player._id });
      await ctx.db.delete(player._id);
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

export const vacuumOldMemories = internalMutation({
  handler: async (
    ctx,
    {
      age,
      ...args
    }: {
      untilTs?: number;
      age: number;
      cursor: null | string;
      soFar: number;
    },
  ) => {
    const untilTs = args.untilTs ?? Date.now() - age;
    const results = await ctx.db
      .query('memories')
      .withIndex('by_creation_time', (q) => q.lt('_creationTime', untilTs))
      .paginate({ cursor: args.cursor, numItems: VACUUM_BATCH_SIZE });
    const vectorsToDelete = [];
    for (const doc of results.page) {
      await ctx.db.delete(doc._id);
      await ctx.db.delete(doc.embeddingId);
      vectorsToDelete.push(doc.embeddingId);
    }
    if (vectorsToDelete.length) {
      await ctx.scheduler.runAfter(0, internal.lib.pinecone.deleteVectors, {
        tableName: 'embeddings',
        ids: vectorsToDelete,
      });
    }
    if (results.isDone) {
      console.debug(`Vacuumed ${results.page.length} old memories.`);
    } else {
      await ctx.scheduler.runAfter(0, internal.crons.vacuumOldMemories, {
        untilTs,
        age,
        cursor: results.continueCursor,
        soFar: args.soFar + results.page.length,
      });
    }
  },
});

const crons = cronJobs();
crons.interval(
  'generate new background music',
  { hours: 24 },
  internal.lib.replicate.enqueueBackgroundMusicGeneration,
);
crons.interval('restart idle agents', { seconds: 60 }, internal.crons.recoverStoppedAgents);
crons.interval('restart thinking agents', { seconds: 60 }, internal.crons.recoverThinkingAgents);
crons.interval('vacuum old journal entries', { hours: 1 }, internal.crons.vacuumOldEntries, {
  table: 'journal',
  age: VACUUM_JOURNAL_AGE,
  cursor: null,
  soFar: 0,
});
crons.interval('vacuum old memory entries', { hours: 6 }, internal.crons.vacuumOldMemories, {
  age: VACUUM_MEMORIES_AGE,
  cursor: null,
  soFar: 0,
});
crons.interval(
  'vacuum abandoned interactions',
  { minutes: 5 },
  internal.crons.vacuumAbandonedInteractions,
);
crons.interval(
  'kick out players',
  { minutes: 5 },
  internal.players.kickPlayers,
)
export default crons;
