import { v } from 'convex/values';
import { internal } from './_generated/api';
import { Doc, Id, TableNames } from './_generated/dataModel';
import {
  DatabaseWriter,
  internalAction,
  internalMutation,
  internalQuery,
} from './_generated/server';
import { MemoryDB } from './lib/memory';
import { asyncMap } from './lib/utils';
import { Characters } from './schema';
import { tiledim, objmap, tilefiledim, bgtiles, tilesetpath } from './maps/firstmap';
import { data as playerSpritesheetData } from './spritesheets/player';

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
    position: { x: 10, y: 10 },
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
    position: { x: 12, y: 10 },
  },
];

export const existingWorld = internalQuery({
  handler: async (ctx): Promise<Doc<'worlds'> | null> => {
    return await ctx.db.query('worlds').first();
  },
});

async function makeWorld(db: DatabaseWriter) {
  const mapId = await db.insert('maps', {
    tileSetUrl: tilesetpath,
    tileSetDim: tilefiledim,
    tileDim: tiledim,
    bgTiles: bgtiles,
    objectTiles: objmap,
  });
  const worldId = await db.insert('worlds', {
    width: bgtiles[0].length,
    height: bgtiles[0][0].length,
    mapId,
    frozen: false,
  });
  return worldId;
}

export const addPlayers = internalMutation({
  args: {
    newWorld: v.optional(v.boolean()),
    characters: v.array(v.object(Characters.fields)),
  },
  handler: async (ctx, args) => {
    const worldId =
      (!args.newWorld && (await ctx.db.query('worlds').first())?._id) || (await makeWorld(ctx.db));
    const charactersByName: Record<string, Id<'characters'>> = {};
    for (const character of args.characters) {
      const characterId = await ctx.db.insert('characters', character);
      charactersByName[character.name] = characterId;
    }
    const playersByName: Record<string, Id<'players'>> = {};
    for (const { name, character, position } of Data) {
      const characterId = charactersByName[character];
      const playerId = await ctx.db.insert('players', {
        name,
        worldId,
        characterId,
      });
      const agentId = await ctx.db.insert('agents', {
        playerId,
        scheduled: false,
        thinking: false,
        worldId,
        nextWakeTs: Date.now(),
        lastWakeTs: Date.now(),
      });
      await ctx.db.patch(playerId, { agentId });
      await ctx.db.insert('journal', {
        playerId,
        data: {
          type: 'stopped',
          reason: 'idle',
          pose: {
            orientation: 0,
            position: position ?? { x: 1, y: 1 + playersByName.length },
          },
        },
      });
      playersByName[name] = playerId;
    }
    return { playersByName, worldId };
  },
});

export const reset = internalAction({
  args: {},
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.engine.freezeAll);
    const worldId = await ctx.runAction(internal.init.seed, { newWorld: true });
    await ctx.runMutation(internal.engine.tick, { worldId });
  },
});

export const resetFrozen = internalAction({
  args: {},
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.engine.freezeAll);
    await ctx.runAction(internal.init.seed, { newWorld: true });
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
    console.log(`Created world
    ${worldId}
    with players
    ${Object.values(playersByName).join(', ')}\n`);
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
