import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { insertInput } from './inputs';

export const sendInput = mutation({
  args: {
    worldId: v.id('worlds'),
    name: v.string(),
    args: v.any(),
  },
  handler: async (ctx, args) => {
    return await insertInput(ctx, args.worldId, args.name as any, args.args);
  },
});
