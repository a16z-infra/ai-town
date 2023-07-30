import { internal } from './_generated/api';
import { Doc, Id } from './_generated/dataModel';
import { mutation } from './_generated/server';

if (!process.env.OPENAI_API_KEY) {
  throw new Error(
    'Missing OPENAI_API_KEY in environment variables.\n' +
      'Set it in the project settings in the Convex dashboard:\n' +
      '    npx convex dashboard\n or https://dashboard.convex.dev',
  );
}

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
        playerName: 'Lucky',
      },
      {
        type: 'plan' as const,
        description: 'You want to find love.',
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
      {
        type: 'plan' as const,
        description: 'You want to hear all the gossip.',
      },
    ],
  },
];

export const seed = mutation({
  handler: async (ctx) => {
    if (await ctx.db.query('players').first()) {
      // Already seeded
      return;
    }
    const worldId =
      (await ctx.db.query('worlds').first())?._id || (await ctx.db.insert('worlds', {}));
    const playersByName: Record<string, Id<'players'>> = {};
    for (const { name } of data) {
      const playerId = await ctx.db.insert('players', {
        name,
        worldId,
      });
      playersByName[name] = playerId;
    }
    const memories = data.flatMap(({ name, memories }) => {
      const playerId = playersByName[name]!;
      return memories.map((memory, idx) => {
        let data: Doc<'memories'>['data'] | undefined;
        if (memory.type === 'relationship') {
          const { playerName, ...relationship } = memory;
          const otherId = playersByName[playerName];
          if (!otherId) throw new Error(`No player named ${playerName}`);
          data = { ...relationship, playerId: otherId };
        } else {
          data = memory;
        }
        const newMemory = {
          playerId,
          data,
          description: memory.description,
          // You can add custom importances to override the calculated ones.
          // importance: memory.importance,
          // Set the memories in the past, so they don't all have the same ts.
          ts: Date.now() - (memories.length - idx) * 1000,
        };

        return newMemory;
      });
    });
    // It will check the cache, calculate missing embeddings, and add them.
    // If it fails here, it won't be retried. But you could clear the memor
    await ctx.scheduler.runAfter(0, internal.lib.memory.embedMemories, { memories });
  },
});

export default seed;
