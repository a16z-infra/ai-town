import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';
import { internalMutation } from './_generated/server';
import { getLatestPlayerMotion } from './journal';
import { AGENT_THINKING_TOO_LONG } from './config';
import { enqueueAgentWake } from './engine';

export const recoverThinkingAgents = internalMutation({
  args: {},
  handler: async (ctx, args) => {
    const world = await ctx.db.query('worlds').order('desc').first();
    if (!world) throw new Error('No world found');
    // TODO: in the future, we can check all players, but for now let's just
    // check the most recent world.
    const agentDocs = await ctx.db
      .query('agents')
      .withIndex('by_worldId_thinking', (q) => q.eq('worldId', world._id).eq('thinking', true))
      .filter((q) => q.lt(q.field('lastWakeTs'), Date.now() - AGENT_THINKING_TOO_LONG))
      .collect();
    for (const agentDoc of agentDocs) {
      await ctx.db.patch(agentDoc._id, {
        thinking: false,
        alsoWake: [],
        nextWakeTs: undefined,
        scheduled: false,
      });
    }
    const agentIds = agentDocs.map((a) => a._id);
    if (agentIds.length === 0) return;
    for (const agentId of agentIds) {
      await enqueueAgentWake(ctx.db, agentId, []);
    }
  },
});

export const recoverStoppedAgents = internalMutation({
  args: {},
  handler: async (ctx, args) => {
    const world = await ctx.db.query('worlds').order('desc').first();
    if (!world) throw new Error('No world found');
    // TODO: in the future, we can check all players, but for now let's just
    // check the most recent world.
    const agentDocs = await ctx.db
      .query('agents')
      .withIndex('by_worldId_thinking', (q) => q.eq('worldId', world._id).eq('thinking', false))
      .collect();
    const agentIds = [];
    for (const agentDoc of agentDocs) {
      const motion = await getLatestPlayerMotion(ctx.db, agentDoc.playerId);
      if (motion.type === 'stopped' || motion.targetEndTs < Date.now()) {
        agentIds.push(agentDoc._id);
      }
    }
    if (agentIds.length === 0) return;
    for (const agentId of agentIds) {
      await enqueueAgentWake(ctx.db, agentId, []);
    }
  },
});

const crons = cronJobs();
// TODO: enable this to recover stopped agents
// crons.interval('restart idle agents', { seconds: 60 }, internal.crons.recoverStoppedAgents);
// TODO: enable this to recover perma-thinking agents
// crons.interval('restart thinking agents', { seconds: 60 }, internal.crons.recoverThinkingAgents);
export default crons;
