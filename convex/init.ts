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
        type: 'identity' as const,
        embedding: [0.1, 0.2, 0.3], // put in full data? hard-code?
        description: `You are a fictional character whose name is Alex.  You enjoy painting,
	programming and reading sci-fi books.  You are currently talking to a human who
	is very interested to get to know you. You are kind but can be sarcastic. You
	dislike repetitive questions. You get SUPER excited about books.`,
      },
      {
        type: 'relationship' as const,
        embedding: [0.1, 0.2, 0.3], // put in full data? hard-code?
        description: 'You like lucky',
        agentName: 'Lucky',
      },
    ],
  },
];

export const seed = mutation({
  handler: async (ctx) => {
    const agentsByName: Record<string, Id<'agents'>> = {};
    for (const { name } of data) {
      const agentId = await ctx.db.insert('agents', {
        name,
        cursor: Date.now(),
        nextActionTs: Date.now(),
      });
      agentsByName[name] = agentId;
    }
    for (const { name, memories } of data) {
      const agentId = agentsByName[name]!;
      for (const memory of memories) {
        const { embedding, ...rest } = memory;
        // TODO: calculate the embedding
        const embeddingId = await ctx.db.insert('embeddings', {
          agentId,
          embedding: memory?.embedding,
        });
        let data: Doc<'memories'>['data'] | undefined;
        if (rest.type === 'relationship') {
          const { agentName, ...relationship } = rest;
          const otherId = agentsByName[agentName];
          if (!otherId) throw new Error(`No agent named ${agentName}`);
          data = { ...relationship, agentId: otherId };
        } else {
          data = rest;
        }

        await ctx.db.insert('memories', {
          agentId,
          embeddingId,
          data,
          description: memory.description,
          // TODO: call openai to calculate
          importance: 1,
          ts: Date.now(),
        });
      }
    }
  },
});

export default seed;
