import { Infer, v } from 'convex/values';
import { Doc, Id } from '../_generated/dataModel';
import { ActionCtx, DatabaseReader, MutationCtx, internalMutation } from '../_generated/server';
import { WorldMap, worldMap, world } from './world';
import {
  AgentDescription,
  agentDescriptionFields,
  agentOperationMap,
  parseAgentDescriptions,
  parseAgents,
  tickAgent,
} from './agent';
import {
  PlayerDescription,
  parsePlayerDescriptions,
  parsePlayers,
  playerDescriptionFields,
  tickPathfinding,
  tickPosition,
} from './player';
import { Agent, AgentOperations } from './agent';
import { Player } from './player';
import { Conversation, parseConversations, tickConversation } from './conversation';
import { GameId, IdTypes, allocGameId, parseGameId } from './ids';
import { FunctionArgs } from 'convex/server';
import { InputArgs, InputNames, inputs } from './inputs';
import {
  AbstractGame,
  EngineUpdate,
  applyEngineUpdate,
  engineUpdate,
  loadEngine,
} from '../engine/abstractGame';
import { internal } from '../_generated/api';

const gameState = v.object({
  world,
  playerDescriptions: v.array(v.object(playerDescriptionFields)),
  agentDescriptions: v.array(v.object(agentDescriptionFields)),
  worldMap,
});
type GameState = Infer<typeof gameState>;

const gameStateDiff = v.object({
  world,
  playerDescriptions: v.optional(v.array(v.object(playerDescriptionFields))),
  agentDescriptions: v.optional(v.array(v.object(agentDescriptionFields))),
  worldMap: v.optional(worldMap),
  agentOperations: v.array(v.object({ name: v.string(), args: v.any() })),
});
type GameStateDiff = Infer<typeof gameStateDiff>;

export class Game extends AbstractGame {
  tickDuration = 16;
  stepDuration = 1000;
  maxTicksPerStep = 600;
  maxInputsPerStep = 32;

  nextId: number;
  conversations: Map<GameId<'conversations'>, Conversation>;
  players: Map<GameId<'players'>, Player>;
  agents: Map<GameId<'agents'>, Agent>;

  descriptionsModified: boolean;
  worldMap: WorldMap;
  playerDescriptions: Map<GameId<'players'>, PlayerDescription>;
  agentDescriptions: Map<GameId<'agents'>, AgentDescription>;

  pendingOperations: Array<{ name: keyof AgentOperations; args: any }> = [];

  constructor(
    engine: Doc<'engines'>,
    public worldId: Id<'worlds'>,
    state: GameState,
  ) {
    super(engine);

    this.nextId = state.world.nextId;
    this.players = parsePlayers(state.world.players, this.nextId);
    this.conversations = parseConversations(this.players, state.world.conversations, this.nextId);
    this.agents = parseAgents(this.players, state.world.agents, this.nextId);

    this.descriptionsModified = false;
    this.worldMap = state.worldMap;
    this.playerDescriptions = parsePlayerDescriptions(
      this.players,
      state.playerDescriptions,
      this.nextId,
    );
    this.agentDescriptions = parseAgentDescriptions(
      this.agents,
      state.agentDescriptions,
      this.nextId,
    );
  }

  static async load(
    db: DatabaseReader,
    worldId: Id<'worlds'>,
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
    const engine = await loadEngine(db, worldStatus.engineId);
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
    const { _id, _creationTime, ...world } = worldDoc;
    const playerDescriptions = playerDescriptionsDocs.map(
      ({ _id, _creationTime, worldId, ...doc }) => doc,
    );
    const agentDescriptions = agentDescriptionsDocs.map(
      ({ _id, _creationTime, worldId, ...doc }) => doc,
    );
    const {
      _id: mapId,
      _creationTime: mapCreationTime,
      worldId: mapWorldId,
      ...worldMap
    } = worldMapDoc;
    return {
      engine,
      gameState: {
        world,
        playerDescriptions,
        agentDescriptions,
        worldMap,
      },
    };
  }

  allocId<T extends IdTypes>(idType: T): GameId<T> {
    const id = allocGameId(idType, this.nextId);
    this.nextId += 1;
    return id;
  }

  parseId<T extends IdTypes>(idType: T, id: string): GameId<T> {
    return parseGameId(idType, id, this.nextId);
  }

  scheduleOperation<T extends keyof AgentOperations>(
    name: T,
    args: FunctionArgs<AgentOperations[T]>,
  ) {
    this.pendingOperations.push({ name, args });
  }

  async handleInput<Name extends InputNames>(now: number, name: Name, args: InputArgs<Name>) {
    // TODO: figure out how to type this properly.
    const handler = inputs[name]?.handler;
    if (!handler) {
      throw new Error(`Invalid input: ${name}`);
    }
    return handler(this, now, args as any);
  }

  tick(now: number) {
    for (const player of this.players.values()) {
      tickPathfinding(this, now, player);
    }
    for (const player of this.players.values()) {
      tickPosition(this, now, player);
    }
    for (const conversation of this.conversations.values()) {
      tickConversation(this, now, conversation);
    }
    for (const agent of this.agents.values()) {
      tickAgent(this, now, agent);
    }
  }

  takeDiff(): GameStateDiff {
    const result: GameStateDiff = {
      world: {
        nextId: this.nextId,
        players: [...this.players.values()],
        conversations: [...this.conversations.values()].map((c) => ({
          ...c,
          participants: Object.fromEntries([...c.participants.entries()]),
        })),
        agents: [...this.agents.values()],
      },
      agentOperations: this.pendingOperations,
    };
    this.pendingOperations = [];
    if (this.descriptionsModified) {
      result.playerDescriptions = [...this.playerDescriptions.values()];
      result.agentDescriptions = [...this.agentDescriptions.values()];
      result.worldMap = this.worldMap;
      this.descriptionsModified = false;
    }
    return result;
  }

  async save(ctx: ActionCtx, engineUpdate: EngineUpdate): Promise<void> {
    const diff = this.takeDiff();
    await ctx.runMutation(internal.aiTown.game.saveWorld, {
      engineId: this.engine._id,
      engineUpdate,
      worldId: this.worldId,
      worldDiff: diff,
    });
  }

  static async saveDiff(ctx: MutationCtx, worldId: Id<'worlds'>, diff: GameStateDiff) {
    const existingWorld = await ctx.db.get(worldId);
    if (!existingWorld) {
      throw new Error(`No world found with id ${worldId}`);
    }
    const newWorld = diff.world;

    // Archive newly deleted players, conversations, and agents.
    for (const player of existingWorld.players) {
      if (!newWorld.players.some((p) => p.id === player.id)) {
        await ctx.db.insert('archivedPlayers', { worldId, ...player });
      }
    }
    for (const conversation of existingWorld.conversations) {
      if (!newWorld.conversations.some((c) => c.id === conversation.id)) {
        const participants = Object.keys(conversation.participants);
        const archivedConversation = {
          worldId,
          id: conversation.id,
          lastMessage: conversation.lastMessage,
          numMessages: conversation.numMessages,
          participants,
          ended: Date.now(),
        };
        await ctx.db.insert('archivedConversations', archivedConversation);
        for (let i = 0; i < participants.length; i++) {
          for (let j = 0; j < participants.length; j++) {
            if (i == j) {
              continue;
            }
            const player1 = participants[i];
            const player2 = participants[j];
            await ctx.db.insert('participatedTogether', {
              worldId,
              conversationId: conversation.id,
              player1,
              player2,
              ended: Date.now(),
            });
          }
        }
      }
    }
    for (const conversation of existingWorld.agents) {
      if (!newWorld.agents.some((a) => a.id === conversation.id)) {
        await ctx.db.insert('archivedAgents', { worldId, ...conversation });
      }
    }

    // Update the world state.
    await ctx.db.replace(worldId, { isDefault: existingWorld.isDefault, ...newWorld });

    // Update the larger description tables if they changed.
    const { playerDescriptions, agentDescriptions, worldMap } = diff;
    if (playerDescriptions) {
      for (const description of playerDescriptions) {
        const existing = await ctx.db
          .query('playerDescriptions')
          .withIndex('worldId', (q) =>
            q.eq('worldId', worldId).eq('playerId', description.playerId),
          )
          .unique();
        if (existing) {
          await ctx.db.replace(existing._id, { worldId, ...description });
        } else {
          await ctx.db.insert('playerDescriptions', { worldId, ...description });
        }
      }
    }
    if (agentDescriptions) {
      for (const description of agentDescriptions) {
        const existing = await ctx.db
          .query('agentDescriptions')
          .withIndex('worldId', (q) => q.eq('worldId', worldId).eq('agentId', description.agentId))
          .unique();
        if (existing) {
          await ctx.db.replace(existing._id, { worldId, ...description });
        } else {
          await ctx.db.insert('agentDescriptions', { worldId, ...description });
        }
      }
    }
    if (worldMap) {
      const existing = await ctx.db
        .query('maps')
        .withIndex('worldId', (q) => q.eq('worldId', worldId))
        .unique();
      if (existing) {
        await ctx.db.replace(existing._id, { worldId, ...worldMap });
      } else {
        await ctx.db.insert('maps', { worldId, ...worldMap });
      }
    }

    // Start the desired agent operations.
    for (const operation of diff.agentOperations) {
      const reference = agentOperationMap[operation.name];
      if (!reference) {
        throw new Error(`Invalid agent operation: ${operation.name}`);
      }
      await ctx.scheduler.runAfter(0, reference, operation.args);
    }
  }
}

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
