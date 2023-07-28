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

const data = [
  {
    name: 'Alex',
    memories: [
      {
        type: 'identity',
        description: `You are a fictional character whose name is Alex.  You enjoy painting,
	programming and reading sci-fi books.  You are currently talking to a human who
	is very interested to get to know you. You are kind but can be sarcastic. You
	dislike repetitive questions. You get SUPER excited about books.`,
      },
      { type: 'relationship', description: 'You like lucky', other: 'Lucky' },
    ],
  },
];

export const seed = mutation({
  handler: async (ctx, args) => {
    await ctx.db.insert('agents', {
      name: 'Cooper',
      cursor: Date.now(),
      nextActionTs: Date.now(),
    });
  },
});

export default seed;
