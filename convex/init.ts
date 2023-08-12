import { v } from 'convex/values';
import { internal } from './_generated/api';
import { Doc, Id } from './_generated/dataModel';
import {
  DatabaseWriter,
  internalAction,
  internalMutation,
  internalQuery,
} from './_generated/server';
import { MemoryDB } from './lib/memory';
import { Characters } from './schema';
import { tiledim, objmap, tilefiledim, bgtiles, tilesetpath } from './maps/firstmap';
import { Descriptions, characters as characterData } from './characterdata/data';

if (!process.env.OPENAI_API_KEY) {
  throw new Error(
    'Missing OPENAI_API_KEY in environment variables.\n' +
      'Set it in the project settings in the Convex dashboard:\n' +
      '    npx convex dashboard\n or https://dashboard.convex.dev',
  );
}

export const existingWorld = internalQuery({
  handler: async (ctx): Promise<Doc<'worlds'> | null> => {
    return await ctx.db.query('worlds').first();
  },
});

async function makeWorld(db: DatabaseWriter, frozen: boolean) {
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
    frozen,
  });
  return worldId;
}

export const addPlayers = internalMutation({
  args: {
    newWorld: v.optional(v.boolean()),
    characters: v.array(v.object(Characters.fields)),
    frozen: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const worldId =
      (!args.newWorld && (await ctx.db.query('worlds').first())?._id) ||
      (await makeWorld(ctx.db, args.frozen ?? false));
    const charactersByName: Record<string, Id<'characters'>> = {};
    for (const character of args.characters) {
      const characterId = await ctx.db.insert('characters', character);
      charactersByName[character.name] = characterId;
    }
    const playersByName: Record<string, Id<'players'>> = {};
    for (const { name, character, position } of Descriptions) {
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
    await ctx.runAction(internal.init.seed, { newWorld: true });
  },
});

export const resetFrozen = internalAction({
  args: {},
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.engine.freezeAll);
    const worldId = await ctx.runAction(internal.init.seed, { newWorld: true, frozen: true });
    console.log('To test one batch a time: npx convex run --no-push engine:tick');
    console.log(
      JSON.stringify({
        worldId,
        noSchedule: true,
      }),
    );
  },
});

export const seed = internalAction({
  args: { newWorld: v.optional(v.boolean()), frozen: v.optional(v.boolean()) },
  handler: async (ctx, { newWorld, frozen }): Promise<Id<'worlds'>> => {
    const existingWorldId = await ctx.runQuery(internal.init.existingWorld);
    if (!newWorld && existingWorldId) return existingWorldId._id;

    const characters = characterData;
    const { playersByName, worldId } = await ctx.runMutation(internal.init.addPlayers, {
      newWorld,
      characters,
      frozen,
    });
    console.log(`Created world ${worldId}`);
    const memories = Descriptions.flatMap(({ name, memories }) => {
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
    await ctx.runMutation(internal.engine.tick, { worldId });
    return worldId;
  },
});

export default seed;
