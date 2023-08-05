import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';
import { getPlayer } from './engine';
import { Id } from './_generated/dataModel';
import { internalMutation } from './_generated/server';

export const recoverAgents = internalMutation({
  args: {},
  handler: async (ctx, args) => {
    const players = await ctx.db.query('players').collect();
    const playersByWorldId: { [worldId: Id<'worlds'>]: Id<'players'>[] } = {};
    for (const playerDoc of players) {
      const player = await getPlayer(ctx.db, playerDoc);
      if (
        !player.thinking &&
        (player.motion.type === 'stopped' || player.motion.targetEndTs < Date.now())
      ) {
        const existing = playersByWorldId[playerDoc.worldId];
        if (!existing) {
          playersByWorldId[playerDoc.worldId] = [player.id];
        } else {
          existing.push(player.id);
        }
      }
    }
    for (const [worldId, forPlayers] of Object.entries(playersByWorldId)) {
      await ctx.scheduler.runAfter(0, internal.engine.tick, {
        worldId: worldId as Id<'worlds'>,
        forPlayers,
      });
    }
  },
});

const crons = cronJobs();
crons.interval('restart idle agents', { seconds: 60 }, internal.crons.recoverAgents);
export default crons;
