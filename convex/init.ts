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
import { MemoryType } from './schema.js';
import { checkEmbeddingCache } from './lib/memory.js';

const data = [
  {
    name: 'Alex',
    memories: [
      {
        type: 'identity' as const,
        description: `You are a fictional character whose name is Alex.  You enjoy painting,
	programming and reading sci-fi books.  You are currently talking to a human who
	is very interested to get to know you. You are kind but can be sarcastic. You
	dislike repetitive questions. You get SUPER excited about books.`,
      },
      {
        type: 'relationship' as const,
        description: 'You like lucky',
        agentName: 'Lucky',
      },
    ],
  },
  {
    name: 'Lucky',
    memories: [
      {
        type: 'identity' as const,
        description: `Lucky is always happy and curious, and he loves cheese. He spends
most of his time reading about the history of science and traveling
through the galaxy on whatever ship will take him. He's very articulate and
infinitely patient, except when he sees a squirrel. He's also incredibly loyal and brave.
Lucky has just returned from an amazing space adventure to explore a distant planet
and he's very excited to tell people about it.`,
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
        nextActionTs: Date.now(),
      });
      agentsByName[name] = agentId;
    }
    for (const { name, memories } of data) {
      const agentId = agentsByName[name]!;
      for (const [idx, memory] of memories.entries()) {
        // TODO: calculate the embedding
        let data: Doc<'memories'>['data'] | undefined;
        if (memory.type === 'relationship') {
          const { agentName, ...relationship } = memory;
          const otherId = agentsByName[agentName];
          if (!otherId) throw new Error(`No agent named ${agentName}`);
          data = { ...relationship, agentId: otherId };
        } else {
          data = memory;
        }
        const newMemory = {
          agentId,
          data,
          description: memory.description,
          // TODO: call openai to calculate
          importance: 1,
          ts: Date.now() + idx * 1000,
        };

        const embedding = await checkEmbeddingCache(ctx.db, memory.description);
        if (embedding) {
          const embeddingId = await ctx.db.insert('embeddings', {
            agentId,
            text: memory.description,
            embedding,
          });
          await ctx.db.insert('memories', {
            embeddingId,
            ...newMemory,
          });
        } else {
          await ctx.scheduler.runAfter(0, internal.lib.memory.embedMemory, newMemory);
        }
      }
    }
  },
});

export default seed;
