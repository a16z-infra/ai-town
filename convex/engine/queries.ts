import { v } from 'convex/values';
import { internalQuery } from '../_generated/server';

// Kept out of abstractGame.ts, which the browser imports (via insertInput),
// so the frontend bundle doesn't pull in convex/_generated/server.
export const loadInputs = internalQuery({
  args: {
    engineId: v.id('engines'),
    processedInputNumber: v.optional(v.number()),
    max: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('inputs')
      .withIndex('byInputNumber', (q) =>
        q.eq('engineId', args.engineId).gt('number', args.processedInputNumber ?? -1),
      )
      .order('asc')
      .take(args.max);
  },
});
