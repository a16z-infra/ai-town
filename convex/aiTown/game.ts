import { Infer, v } from 'convex/values';
import { Doc, Id } from '../_generated/dataModel';
import {
  ActionCtx,
  DatabaseReader,
  MutationCtx,
  internalMutation,
  internalQuery,
} from '../_generated/server';
import { World, serializedWorld } from './world';
import { WorldMap, serializedWorldMap } from './worldMap';
import { PlayerDescription, serializedPlayerDescription } from './playerDescription';
import { Location, locationFields, playerLocation } from './location';
import { runAgentOperation } from './agent';
import { GameId, IdTypes, allocGameId } from './ids';
import { InputArgs, InputNames, inputs } from './inputs';
import {
  AbstractGame,
  EngineUpdate,
  applyEngineUpdate,
  engineUpdate,
  loadEngine,
} from '../engine/abstractGame';
import { internal } from '../_generated/api';
import { HistoricalObject } from '../engine/historicalObject';
import { AgentDescription, serializedAgentDescription } from './agentDescription';
import { parseMap, serializeMap } from '../util/object';

const gameState = v.object({
  world: v.object(serializedWorld),
  playerDescriptions: v.array(v.object(serializedPlayerDescription)),
  agentDescriptions: v.array(v.object(serializedAgentDescription)),
  worldMap: v.object(serializedWorldMap),
  characterConfigs: v.array(
    v.object({
      id: v.string(),
      config: v.object({
        name: v.string(),
        textureUrl: v.string(),
        spritesheetData: v.any(),
        speed: v.optional(v.number()),
      }),
    }),
  ),
});
type GameState = Infer<typeof gameState>;

const gameStateDiff = v.object({
  world: v.object(serializedWorld),
  playerDescriptions: v.optional(v.array(v.object(serializedPlayerDescription))),
  agentDescriptions: v.optional(v.array(v.object(serializedAgentDescription))),
  worldMap: v.optional(v.object(serializedWorldMap)),
  characterConfigs: v.optional(
    v.array(
      v.object({
        id: v.string(),
        config: v.object({
          name: v.string(),
          textureUrl: v.string(),
          spritesheetData: v.any(),
          speed: v.optional(v.number()),
        }),
      }),
    ),
  ),
  agentOperations: v.array(v.object({ name: v.string(), args: v.any() })),
});
type GameStateDiff = Infer<typeof gameStateDiff>;

export class Game extends AbstractGame {
  tickDuration = 16;
  stepDuration = 1000;
  maxTicksPerStep = 600;
  maxInputsPerStep = 32;

  world: World;
  characterConfigs?: Map<
    string,
    {
      name: string;
      textureUrl: string;
      spritesheetData: any;
      speed?: number;
    }
  >;

  historicalLocations: Map<GameId<'players'>, HistoricalObject<Location>>;

  descriptionsModified: boolean;
  worldMap: WorldMap;
  playerDescriptions: Map<GameId<'players'>, PlayerDescription>;
  agentDescriptions: Map<GameId<'agents'>, AgentDescription>;
  nextId: number;

  pendingOperations: Array<{ name: string; args: any }> = [];

  numPathfinds: number;

  constructor(
    engine: Doc<'engines'>,
    public worldId: Id<'worlds'>,
    state: GameState,
  ) {
    super(engine);

    console.log('Initializing game state:', {
      hasCharacterConfigs: !!state.characterConfigs,
      numCharacterConfigs: state.characterConfigs?.length ?? 0,
      numPlayerDescriptions: state.playerDescriptions.length,
      players: state.world.players.map((p) => p.id),
    });

    this.world = new World(state.world);
    delete this.world.historicalLocations;

    this.descriptionsModified = false;
    this.worldMap = new WorldMap(state.worldMap);
    this.agentDescriptions = parseMap(state.agentDescriptions, AgentDescription, (a) => a.agentId);
    this.playerDescriptions = parseMap(
      state.playerDescriptions,
      PlayerDescription,
      (p) => p.playerId,
    );
    this.nextId = state.world.nextId || 0;

    this.historicalLocations = new Map();

    // Initialize character configs from state
    this.characterConfigs = new Map(
      state.characterConfigs?.map(({ id, config }) => [id, config]) ?? [],
    );

    console.log('After game state initialization:', {
      hasCharacterConfigs: !!this.characterConfigs,
      numCharacterConfigs: this.characterConfigs?.size ?? 0,
      numPlayerDescriptions: this.playerDescriptions.size,
      players: Array.from(this.world.players.keys()),
    });

    this.numPathfinds = 0;
  }

  static async load(
    db: DatabaseReader,
    worldId: Id<'worlds'>,
    generationNumber: number,
  ): Promise<{ engine: Doc<'engines'>; gameState: GameState }> {
    const worldDoc = await db.get(worldId);
    if (!worldDoc) {
      throw new Error(`No world found with id ${worldId}`);
    }
    const worldStatus = await db
      .query('worldStatus')
      .withIndex('worldId', (q) => q.eq('worldId', worldId))
      .unique();
    if (!worldStatus) {
      throw new Error(`No engine found for world ${worldId}`);
    }
    const engine = await loadEngine(db, worldStatus.engineId, generationNumber);
    const playerDescriptionsDocs = await db
      .query('playerDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', worldId))
      .collect();
    const agentDescriptionsDocs = await db
      .query('agentDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', worldId))
      .collect();
    const worldMapDoc = await db
      .query('maps')
      .withIndex('worldId', (q) => q.eq('worldId', worldId))
      .unique();
    if (!worldMapDoc) {
      throw new Error(`No map found for world ${worldId}`);
    }

    // Load character configs
    const characterConfigDocs = await db
      .query('characterConfigs')
      .withIndex('worldId', (q) => q.eq('worldId', worldId))
      .collect();

    // Properly deserialize the world state
    const { _id, _creationTime, ...worldData } = worldDoc;
    const world = new World(worldData).serialize();

    const playerDescriptions = playerDescriptionsDocs
      // Discard player descriptions for players that no longer exist.
      .filter((d) => !!world.players.find((p) => p.id === d.playerId))
      .map(({ _id, _creationTime, worldId: _, ...doc }) => doc);
    const agentDescriptions = agentDescriptionsDocs
      .filter((a) => !!world.agents.find((p) => p.id === a.agentId))
      .map(({ _id, _creationTime, worldId: _, ...doc }) => doc);
    const {
      _id: _mapId,
      _creationTime: _mapCreationTime,
      worldId: _mapWorldId,
      ...worldMap
    } = worldMapDoc;

    // Map character configs to the expected format
    const characterConfigs = characterConfigDocs.map(
      ({ _id, _creationTime, worldId: _, ...doc }) => ({
        id: doc.id,
        config: doc.config,
      }),
    );

    return {
      engine,
      gameState: {
        world,
        playerDescriptions,
        agentDescriptions,
        worldMap,
        characterConfigs,
      },
    };
  }

  allocId<T extends IdTypes>(idType: T): GameId<T> {
    const id = allocGameId(idType, this.world.nextId);
    this.world.nextId += 1;
    return id;
  }

  scheduleOperation(name: string, args: unknown) {
    this.pendingOperations.push({ name, args });
  }

  handleInput<Name extends InputNames>(now: number, name: Name, args: InputArgs<Name>) {
    const handler = inputs[name]?.handler;
    if (!handler) {
      throw new Error(`Invalid input: ${name}`);
    }
    return handler(this, now, args as any);
  }

  beginStep(_now: number) {
    // Store the current location of all players in the history tracking buffer.
    this.historicalLocations.clear();
    for (const player of this.world.players.values()) {
      this.historicalLocations.set(
        player.id,
        new HistoricalObject(locationFields, playerLocation(player)),
      );
    }
    this.numPathfinds = 0;
  }

  tick(now: number) {
    for (const player of this.world.players.values()) {
      player.tick(this, now);
    }
    for (const player of this.world.players.values()) {
      player.tickPathfinding(this, now);
    }
    for (const player of this.world.players.values()) {
      player.tickPosition(this, now);
    }
    for (const conversation of this.world.conversations.values()) {
      conversation.tick(this, now);
    }
    for (const agent of this.world.agents.values()) {
      agent.tick(this, now);
    }

    // Save each player's location into the history buffer at the end of
    // each tick.
    for (const player of this.world.players.values()) {
      let historicalObject = this.historicalLocations.get(player.id);
      if (!historicalObject) {
        historicalObject = new HistoricalObject(locationFields, playerLocation(player));
        this.historicalLocations.set(player.id, historicalObject);
      }
      historicalObject.update(now, playerLocation(player));
    }
  }

  async saveStep(ctx: ActionCtx, engineUpdate: EngineUpdate): Promise<void> {
    const diff = this.takeDiff();
    await ctx.runMutation(internal.aiTown.game.saveWorld, {
      engineId: this.engine._id,
      engineUpdate,
      worldId: this.worldId,
      worldDiff: diff,
    });
  }

  takeDiff(): GameStateDiff {
    const historicalLocations = [];
    let bufferSize = 0;
    for (const [id, historicalObject] of this.historicalLocations.entries()) {
      const buffer = historicalObject.pack();
      if (!buffer) {
        continue;
      }
      historicalLocations.push({ playerId: id, location: buffer });
      bufferSize += buffer.byteLength;
    }
    if (bufferSize > 0) {
      console.debug(
        `Packed ${Object.entries(historicalLocations).length} history buffers in ${(
          bufferSize / 1024
        ).toFixed(2)}KiB.`,
      );
    }
    this.historicalLocations.clear();

    console.log('Taking game state diff:', {
      descriptionsModified: this.descriptionsModified,
      numPlayers: this.world.players.size,
      numPlayerDescriptions: this.playerDescriptions.size,
      numCharacterConfigs: this.characterConfigs?.size ?? 0,
      characterConfigs: Array.from(this.characterConfigs?.entries() ?? []).map(([id, config]) => ({
        id,
        textureUrl: config.textureUrl,
      })),
    });

    const result: GameStateDiff = {
      world: {
        ...this.world.serialize(),
        players: Array.from(this.world.players.values()).map((p) => p.serialize()),
        agents: Array.from(this.world.agents.values()).map((a) => a.serialize()),
      },
      agentOperations: this.pendingOperations,
    };
    this.pendingOperations = [];

    // Always include descriptions and configs if they exist
    const hasCharacterConfigs = this.characterConfigs && this.characterConfigs.size > 0;
    const hasDescriptions = this.playerDescriptions.size > 0 || this.agentDescriptions.size > 0;

    if (hasCharacterConfigs || hasDescriptions || this.descriptionsModified) {
      result.playerDescriptions = Array.from(this.playerDescriptions.values()).map((desc) =>
        desc.serialize(),
      );
      result.agentDescriptions = Array.from(this.agentDescriptions.values()).map((desc) =>
        desc.serialize(),
      );
      result.worldMap = this.worldMap.serialize();
      result.characterConfigs = Array.from(this.characterConfigs?.entries() ?? []).map(
        ([id, config]) => ({
          id,
          config,
        }),
      );
    }

    console.log('Game state diff result:', {
      hasPlayerDescriptions: !!result.playerDescriptions,
      numPlayerDescriptions: result.playerDescriptions?.length ?? 0,
      playerDescriptions: result.playerDescriptions?.map((desc) => ({
        playerId: desc.playerId,
        character: desc.character,
        textureUrl: desc.textureUrl,
      })),
      hasCharacterConfigs: !!result.characterConfigs,
      numCharacterConfigs: result.characterConfigs?.length ?? 0,
      characterConfigIds: result.characterConfigs?.map((c) => c.id) ?? [],
    });

    // Only reset the flag after we've included the descriptions in the diff
    this.descriptionsModified = false;

    return result;
  }

  static async saveDiff(ctx: MutationCtx, worldId: Id<'worlds'>, diff: GameStateDiff) {
    const { world, playerDescriptions, agentDescriptions, characterConfigs } = diff;

    console.log('Saving game diff:', {
      hasWorld: !!world,
      numPlayerDescriptions: playerDescriptions?.length ?? 0,
      playerDescriptions: playerDescriptions?.map((desc) => ({
        playerId: desc.playerId,
        character: desc.character,
      })),
      numAgentDescriptions: agentDescriptions?.length ?? 0,
      numCharacterConfigs: characterConfigs?.length ?? 0,
      characterConfigIds: characterConfigs?.map((c) => c.id) ?? [],
    });

    if (world) {
      await ctx.db.patch(worldId, world);
    }

    if (playerDescriptions) {
      // Delete old player descriptions
      const oldDescriptions = await ctx.db
        .query('playerDescriptions')
        .withIndex('worldId', (q) => q.eq('worldId', worldId))
        .collect();
      for (const doc of oldDescriptions) {
        await ctx.db.delete(doc._id);
      }

      // Insert new player descriptions
      for (const description of playerDescriptions) {
        console.log('Saving player description:', {
          worldId,
          playerId: description.playerId,
          character: description.character,
        });
        await ctx.db.insert('playerDescriptions', {
          worldId,
          ...description,
        });
      }
    }

    if (agentDescriptions) {
      // Delete old agent descriptions
      const oldDescriptions = await ctx.db
        .query('agentDescriptions')
        .withIndex('worldId', (q) => q.eq('worldId', worldId))
        .collect();
      for (const doc of oldDescriptions) {
        await ctx.db.delete(doc._id);
      }

      // Insert new agent descriptions
      for (const description of agentDescriptions) {
        console.log('Saving agent description:', {
          worldId,
          agentId: description.agentId,
        });
        await ctx.db.insert('agentDescriptions', {
          worldId,
          ...description,
        });
      }
    }

    if (diff.worldMap) {
      const existing = await ctx.db
        .query('maps')
        .withIndex('worldId', (q) => q.eq('worldId', worldId))
        .unique();
      if (existing) {
        await ctx.db.replace(existing._id, { worldId, ...diff.worldMap });
      } else {
        await ctx.db.insert('maps', { worldId, ...diff.worldMap });
      }
    }

    if (characterConfigs) {
      // Delete old character configs
      const oldConfigs = await ctx.db
        .query('characterConfigs')
        .withIndex('worldId', (q) => q.eq('worldId', worldId))
        .collect();
      for (const doc of oldConfigs) {
        await ctx.db.delete(doc._id);
      }

      // Insert new character configs
      for (const { id, config } of characterConfigs) {
        console.log('Saving character config:', {
          worldId,
          id,
          textureUrl: config.textureUrl,
        });
        await ctx.db.insert('characterConfigs', { worldId, id, config });
      }
    }

    // Start the desired agent operations.
    for (const operation of diff.agentOperations) {
      await runAgentOperation(ctx, operation.name, operation.args);
    }
  }
}

export const loadWorld = internalQuery({
  args: {
    worldId: v.id('worlds'),
    generationNumber: v.number(),
  },
  handler: async (ctx, args) => {
    return await Game.load(ctx.db, args.worldId, args.generationNumber);
  },
});

export const saveWorld = internalMutation({
  args: {
    engineId: v.id('engines'),
    engineUpdate,
    worldId: v.id('worlds'),
    worldDiff: gameStateDiff,
  },
  handler: async (ctx, args) => {
    await applyEngineUpdate(ctx, args.engineId, args.engineUpdate);
    await Game.saveDiff(ctx, args.worldId, args.worldDiff);
  },
});
