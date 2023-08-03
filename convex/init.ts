import { v } from 'convex/values';
import { internal } from './_generated/api';
import { Doc, Id, TableNames } from './_generated/dataModel';
import { internalAction, internalMutation, internalQuery } from './_generated/server';
import { MemoryDB } from './lib/memory';
import { asyncMap } from './lib/utils';
import { Characters } from './types';
import { data as playerSpritesheetData } from './spritesheets/player';
import { getRandomPosition } from './lib/physics';

if (!process.env.OPENAI_API_KEY) {
  throw new Error(
    'Missing OPENAI_API_KEY in environment variables.\n' +
      'Set it in the project settings in the Convex dashboard:\n' +
      '    npx convex dashboard\n or https://dashboard.convex.dev',
  );
}

const Data = [
  {
    name: 'Alex',
    character: 'player',
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
    character: 'player',
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

export const existingWorld = internalQuery({
  handler: async (ctx): Promise<Doc<'worlds'> | null> => {
    return await ctx.db.query('worlds').first();
  },
});

export const addPlayers = internalMutation({
  args: {
    newWorld: v.optional(v.boolean()),
    characters: v.array(v.object(Characters.fields)),
  },
  handler: async (ctx, args) => {
    const worldId =
      (!args.newWorld && (await ctx.db.query('worlds').first())?._id) ||
      (await ctx.db.insert('worlds', {
        width: 100,
        height: 100,
        walls: [],
      }));
    const charactersByName: Record<string, Id<'characters'>> = {};
    for (const character of args.characters) {
      const characterId = await ctx.db.insert('characters', character);
      charactersByName[character.name] = characterId;
    }
    const playersByName: Record<string, Id<'players'>> = {};
    for (let i = 0; i < 5; i++) {
      const name = `Player ${i}`;
      const characterId = charactersByName['player'];
      const playerId = await ctx.db.insert('players', {
        name,
        worldId,
        characterId,
      });
      await ctx.db.insert('journal', {
        playerId,
        ts: Date.now(),
        data: {
          type: 'stopped',
          reason: 'idle',
          pose: {
            orientation: 0,
            position: getRandomPosition(),
          },
        },
      });
      playersByName[name] = playerId;
    }
    for (const { name, character } of Data) {
      const characterId = charactersByName[character];
      const playerId = await ctx.db.insert('players', {
        name,
        worldId,
        characterId,
      });
      playersByName[name] = playerId;
    }
    return { playersByName, worldId };
  },
});

export const debugClearAll = internalMutation({
  args: {},
  handler: async (ctx, args) => {
    const deleteAll = async (tableName: TableNames) => {
      // fetch the most recent 1000
      const docs = await ctx.db.query(tableName).order('desc').take(1000);
      await asyncMap(
        docs.map((d) => d._id),
        ctx.db.delete,
      );
      if (await ctx.db.query(tableName).first()) {
        console.log("Didn't delete all: more than 1k entries in " + tableName);
      }
    };
    await deleteAll('players');
    await deleteAll('characters');
    await deleteAll('journal');
    await deleteAll('memories');
    await deleteAll('memoryAccesses');
    await deleteAll('conversations');
    await deleteAll('worlds');
  },
});

export const reset = internalAction({
  args: {},
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.init.debugClearAll, {});
    const worldId = await ctx.runAction(internal.init.seed, {});
    await ctx.runMutation(internal.engine.tick, { worldId });
  },
});

export const seed = internalAction({
  args: { newWorld: v.optional(v.boolean()) },
  handler: async (ctx, { newWorld }): Promise<Id<'worlds'>> => {
    const existingWorldId = await ctx.runQuery(internal.init.existingWorld);
    if (!newWorld && existingWorldId) return existingWorldId._id;
    const characters = [
      {
        name: 'player',
        textureUrl: '/assets/player.png',
        spritesheetData: playerSpritesheetData,
        speed: 0.1,
      },
    ];
    const { playersByName, worldId } = await ctx.runMutation(internal.init.addPlayers, {
      newWorld,
      characters,
    });
    const memories = Data.flatMap(({ name, memories }) => {
      const playerId = playersByName[name]!;
      return memories.map((memory, idx) => {
        const { description, ...rest } = memory;
        let data: Doc<'memories'>['data'] | undefined;
        if (rest.type === 'relationship') {
          const { playerName, ...relationship } = rest;
          const otherId = playersByName[playerName];
          if (!otherId) throw new Error(`No player named ${playerName}`);
          data = { ...relationship, playerId: otherId };
        } else {
          data = rest;
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
    await MemoryDB(ctx).addMemories(memories);
    return worldId;
  },
});

export default seed;
