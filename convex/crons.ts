import { cronJobs } from 'convex/server';
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
        await ctx.db.patch(agentDoc._id, {
          thinking: false,
          nextWakeTs: ts,
          scheduled,
        });
      }
    }
  },
});

export const recoverStoppedAgents = internalMutation({
  args: {},
  handler: async (ctx, args) => {
    const world = await ctx.db.query('worlds').order('desc').first();
    if (!world) throw new Error('No world found');
    if (world.frozen) {
      console.log("Didn't tick: world frozen");
      return;
    }
    // TODO: in the future, we can check all players, but for now let's just
    // check the most recent world.
    const agentDocs = await ctx.db
      .query('agents')
      .withIndex('by_worldId_thinking', (q) => q.eq('worldId', world._id).eq('thinking', false))
      .collect();
    for (const agentDoc of agentDocs) {
      const motion = await getLatestPlayerMotion(ctx.db, agentDoc.playerId);
      if (motion.type === 'stopped' || motion.targetEndTs < Date.now()) {
        console.error("We found a stationary agent that's not thinking. Tick time");
        await enqueueAgentWake(ctx, agentDoc._id, world._id, Date.now());
        return;
      }
    }
  },
});

const crons = cronJobs();
// TODO: enable this to recover stopped agents
// crons.interval('restart idle agents', { seconds: 60 }, internal.crons.recoverStoppedAgents);
// TODO: enable this to recover perma-thinking agents
// crons.interval('restart thinking agents', { seconds: 60 }, internal.crons.recoverThinkingAgents);
export default crons;
