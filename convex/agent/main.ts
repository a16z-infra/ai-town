'use node';

import { v } from 'convex/values';
import { internalAction } from '../_generated/server';
import { runBatchedAgentLoop } from './batching';
import { internal } from '../_generated/api';

export const batchedAgentLoop = internalAction({
  args: {
    schedulerId: v.id('agentSchedulers'),
    generationNumber: v.number(),
    maxDuration: v.number(),
  },
  handler: async (ctx, args) => {
    const generationNumber = await runBatchedAgentLoop(
      ctx,
      args.schedulerId,
      args.generationNumber,
      args.maxDuration,
    );
    if (generationNumber === null) {
      return;
    }
    await ctx.scheduler.runAfter(0, internal.agent.main.batchedAgentLoop, {
      schedulerId: args.schedulerId,
      generationNumber,
      maxDuration: args.maxDuration,
    });
  },
});
