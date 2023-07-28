import { v } from 'convex/values';
import { api, internal } from './_generated/api.js';
import { Doc, Id } from './_generated/dataModel';
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server';

export const seed = mutation({
  args: {},
  handler: async (ctx, args) => {
    await ctx.db.insert('agents', {
      summary: 'Hello',
      location: ['root'],
      status: 'idle',
      lastObservation: 0,
      objects: [],
    });
  },
});

export default seed;
