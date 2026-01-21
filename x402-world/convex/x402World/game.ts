import { Infer, v } from 'convex/values';
import { Doc, Id } from '../_generated/dataModel';
import {
  ActionCtx,
  DatabaseReader,
  MutationCtx,
  internalMutation,
  internalQuery,
} from '../_generated/server';
import { World, serializedWorld, Signal, Caravan } from './world';
import { WorldMap, serializedWorldMap } from './worldMap';
import { AgentDescription, serializedAgentDescription } from './agentDescription';
import { Agent, serializedAgent } from './agent';
import { Transaction, serializedTransaction } from './transaction';
import { GameId, IdTypes, allocGameId, parseGameId } from './ids';
import { internal } from '../_generated/api';
import { HistoricalObject } from '../engine/historicalObject';
import { parseMap, serializeMap } from '../util/object';

// ═══════════════════════════════════════════════════════════════════════════════
// X402 WORLD GAME ENGINE
// Manages the simulation loop, state updates, and agent coordination
//
// TICK HIERARCHY (from Gas Town GUPP → X402 XAPI):
// 1. Process all pending signals
// 2. Execute agent state machines
// 3. Process transaction lifecycle
// 4. Update caravan progress
// 5. Clean up expired entities
// 6. Save world state
// ═══════════════════════════════════════════════════════════════════════════════

// Location tracking for historical replay
export type Location = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  speed: number;
};

export const locationFields = [
  { name: 'x', precision: 8 },
  { name: 'y', precision: 8 },
  { name: 'dx', precision: 8 },
  { name: 'dy', precision: 8 },
  { name: 'speed', precision: 16 },
];

export function agentLocation(agent: Agent): Location {
  return {
    x: agent.position.x,
    y: agent.position.y,
    dx: agent.facing.dx,
    dy: agent.facing.dy,
    speed: 0, // Agents don't have continuous speed in X402 World
  };
}

// Game state structures
const gameState = v.object({
  world: v.object(serializedWorld),
  agentDescriptions: v.array(v.object(serializedAgentDescription)),
  worldMap: v.object(serializedWorldMap),
});
type GameState = Infer<typeof gameState>;

const gameStateDiff = v.object({
  world: v.object(serializedWorld),
  agentDescriptions: v.optional(v.array(v.object(serializedAgentDescription))),
  worldMap: v.optional(v.object(serializedWorldMap)),
  agentOperations: v.array(v.object({ name: v.string(), args: v.any() })),
});
type GameStateDiff = Infer<typeof gameStateDiff>;

// ═══════════════════════════════════════════════════════════════════════════════
// GAME CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class Game {
  // Engine timing
  tickDuration = 100;     // 100ms per tick (10 ticks/second)
  stepDuration = 1000;    // 1 second per step
  maxTicksPerStep = 50;   // Max ticks before forcing save
  maxInputsPerStep = 64;  // Max inputs per step

  // World state
  world: World;
  worldMap: WorldMap;
  agentDescriptions: Map<GameId<'agents'>, AgentDescription>;

  // Historical tracking
  historicalLocations: Map<GameId<'agents'>, HistoricalObject<Location>>;

  // Engine state
  engine: Doc<'engines'>;
  worldId: Id<'worlds'>;
  descriptionsModified: boolean;
  pendingOperations: Array<{ name: string; args: any }> = [];

  constructor(
    engine: Doc<'engines'>,
    worldId: Id<'worlds'>,
    state: GameState,
  ) {
    this.engine = engine;
    this.worldId = worldId;

    this.world = new World(state.world);
    delete this.world.historicalLocations;

    this.worldMap = new WorldMap(state.worldMap);
    this.agentDescriptions = parseMap(
      state.agentDescriptions,
      AgentDescription,
      (a) => a.agentId
    );

    this.descriptionsModified = false;
    this.historicalLocations = new Map();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ID ALLOCATION
  // ═══════════════════════════════════════════════════════════════════════════════

  allocId<T extends IdTypes>(idType: T): GameId<T> {
    const id = allocGameId(idType, this.world.nextId);
    this.world.nextId += 1;
    return id;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // OPERATION SCHEDULING
  // ═══════════════════════════════════════════════════════════════════════════════

  scheduleOperation(name: string, args: unknown) {
    this.pendingOperations.push({ name, args });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // TICK PROCESSING
  // ═══════════════════════════════════════════════════════════════════════════════

  beginStep(now: number) {
    // Initialize historical location tracking for this step
    this.historicalLocations.clear();
    for (const agent of this.world.agents.values()) {
      this.historicalLocations.set(
        agent.id,
        new HistoricalObject(locationFields, agentLocation(agent)),
      );
    }
  }

  tick(now: number) {
    // 1. Process all agents
    for (const agent of this.world.agents.values()) {
      agent.tick(this, now);
    }

    // 2. Process all transactions
    for (const transaction of this.world.transactions.values()) {
      transaction.tick(this, now);
    }

    // 3. Process caravans
    this.tickCaravans(now);

    // 4. Clean up expired signals
    this.world.cleanupExpiredSignals(now);

    // 5. Update historical locations
    for (const agent of this.world.agents.values()) {
      let historicalObject = this.historicalLocations.get(agent.id);
      if (!historicalObject) {
        historicalObject = new HistoricalObject(locationFields, agentLocation(agent));
        this.historicalLocations.set(agent.id, historicalObject);
      }
      historicalObject.update(now, agentLocation(agent));
    }

    // 6. Update world metrics
    this.updateWorldMetrics(now);
  }

  private tickCaravans(now: number) {
    for (const caravan of this.world.caravans.values()) {
      switch (caravan.status) {
        case 'forming':
          // Check if all participants are ready
          const allReady = caravan.participants.every(id => {
            const agent = this.world.agents.get(id);
            return agent && agent.state === 'idle';
          });
          if (allReady && caravan.transactions.length > 0) {
            caravan.status = 'ready';
          }
          break;

        case 'ready':
          // Begin execution
          caravan.status = 'executing';
          caravan.executed = now;
          break;

        case 'executing':
          // Check if all transactions are complete
          const allComplete = caravan.transactions.every(id => {
            const tx = this.world.transactions.get(id);
            return tx && (tx.status === 'completed' || tx.status === 'failed');
          });
          if (allComplete) {
            caravan.status = 'settling';
          }
          break;

        case 'settling':
          // Finalize caravan
          const anyFailed = caravan.transactions.some(id => {
            const tx = this.world.transactions.get(id);
            return tx && tx.status === 'failed';
          });
          caravan.status = anyFailed ? 'failed' : 'completed';
          caravan.settled = now;
          break;
      }
    }
  }

  private updateWorldMetrics(now: number) {
    // Count active agents
    this.world.activeAgentCount = [...this.world.agents.values()].filter(
      a => a.state !== 'sleeping' && a.state !== 'recycling'
    ).length;

    // Update last modified
    this.world.lastUpdated = now;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // INPUT HANDLING
  // ═══════════════════════════════════════════════════════════════════════════════

  handleInput(now: number, name: string, args: any): any {
    switch (name) {
      case 'spawnAgent':
        return this.inputSpawnAgent(now, args);
      case 'createTransaction':
        return this.inputCreateTransaction(now, args);
      case 'submitPayment':
        return this.inputSubmitPayment(now, args);
      case 'createSignal':
        return this.inputCreateSignal(now, args);
      case 'createCaravan':
        return this.inputCreateCaravan(now, args);
      case 'joinCaravan':
        return this.inputJoinCaravan(now, args);
      default:
        throw new Error(`Unknown input: ${name}`);
    }
  }

  private inputSpawnAgent(now: number, args: {
    role: string;
    name: string;
    walletAddress: string;
    publicKey: string;
    capabilities?: string[];
    pricePerRequest?: number;
    isAutonomous?: boolean;
    operatorId?: string;
  }): GameId<'agents'> {
    const agentId = this.allocId('agents');

    // Find spawn position in appropriate zone
    const zone = this.getSpawnZone(args.role);
    const position = this.findSpawnPosition(zone);

    const agent = new Agent({
      id: agentId,
      role: args.role as any,
      state: 'idle',
      name: args.name,
      walletAddress: args.walletAddress,
      publicKey: args.publicKey,
      position,
      facing: { dx: 1, dy: 0 },
      currentZone: zone?.id,
      balance: { sol: 0, usdc: 0, x402: 0 },
      escrowBalance: 0,
      totalEarned: 0,
      totalSpent: 0,
      capabilities: args.capabilities || ['*'],
      pricePerRequest: args.pricePerRequest || 1000,
      reputation: 50,
      successRate: 0.5,
      totalTransactions: 0,
      totalServiced: 0,
      recursionDepth: 0,
      maxRecursionDepth: 5,
      confidence: 50,
      lastActive: now,
      isAutonomous: args.isAutonomous ?? true,
      operatorId: args.operatorId,
      created: now,
      lastMaintenance: now,
    });

    this.world.agents.set(agentId, agent);
    this.descriptionsModified = true;

    return agentId;
  }

  private inputCreateTransaction(now: number, args: {
    senderId: string;
    receiverId: string;
    amount: number;
    token: string;
    type: string;
    description: string;
    serviceId?: string;
    endpoint?: string;
    requestPayload?: any;
  }): GameId<'transactions'> {
    const sender = this.world.agents.get(parseGameId('agents', args.senderId));
    const receiver = this.world.agents.get(parseGameId('agents', args.receiverId));

    if (!sender || !receiver) {
      throw new Error('Invalid sender or receiver');
    }

    const transaction = Transaction.create(this, now, sender, receiver, {
      type: args.type as any,
      amount: args.amount,
      token: args.token,
      description: args.description,
      serviceId: args.serviceId,
      endpoint: args.endpoint,
      requestPayload: args.requestPayload,
    });

    return transaction.id;
  }

  private inputSubmitPayment(now: number, args: {
    transactionId: string;
    serializedTransaction: string;
    signature?: string;
  }): void {
    const transaction = this.world.transactions.get(
      parseGameId('transactions', args.transactionId)
    );

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    transaction.submitPayment(args.serializedTransaction, args.signature);
  }

  private inputCreateSignal(now: number, args: {
    type: string;
    source: string;
    target?: string;
    payload: any;
    confidence: number;
    priority: number;
    expiresIn: number;
  }): GameId<'signals'> {
    const signalId = this.allocId('signals');

    const signal = new Signal({
      id: signalId,
      type: args.type as any,
      source: args.source,
      target: args.target,
      payload: args.payload,
      confidence: args.confidence,
      priority: args.priority,
      expires: now + args.expiresIn,
      created: now,
    });

    this.world.signals.set(signalId, signal);
    return signalId;
  }

  private inputCreateCaravan(now: number, args: {
    name: string;
    leader: string;
    strategy: string;
    mevProtection?: boolean;
  }): GameId<'caravans'> {
    const caravanId = this.allocId('caravans');

    const caravan = new Caravan({
      id: caravanId,
      name: args.name,
      status: 'forming',
      leader: args.leader,
      participants: [args.leader],
      transactions: [],
      totalValue: 0,
      strategy: args.strategy,
      created: now,
      mevProtection: args.mevProtection ?? true,
    });

    this.world.caravans.set(caravanId, caravan);
    return caravanId;
  }

  private inputJoinCaravan(now: number, args: {
    caravanId: string;
    agentId: string;
    transactionId?: string;
  }): void {
    const caravan = this.world.caravans.get(parseGameId('caravans', args.caravanId));
    if (!caravan) {
      throw new Error('Caravan not found');
    }
    if (caravan.status !== 'forming') {
      throw new Error('Caravan is not accepting new participants');
    }

    caravan.participants.push(parseGameId('agents', args.agentId));

    if (args.transactionId) {
      const tx = this.world.transactions.get(parseGameId('transactions', args.transactionId));
      if (tx) {
        caravan.transactions.push(tx.id);
        caravan.totalValue += tx.amount;
        tx.caravanId = caravan.id;
        tx.caravanIndex = caravan.transactions.length - 1;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════════════════════

  private getSpawnZone(role: string): typeof this.worldMap.zones extends Map<any, infer V> ? V : never | undefined {
    // Map roles to preferred spawn zones
    const zonePreferences: Record<string, string> = {
      oracle: 'nexus',
      mixer: 'exchange',
      watcher: 'nexus',
      recursion: 'nexus',
      sentinel: 'gateway',
      node: 'commons',
      diamond: 'vault',
      specialist: 'lab',
    };

    const preferredType = zonePreferences[role] || 'commons';

    for (const zone of this.worldMap.zones.values()) {
      if (zone.type === preferredType) {
        return zone;
      }
    }

    return [...this.worldMap.zones.values()][0];
  }

  private findSpawnPosition(zone: any): { x: number; y: number } {
    if (!zone) {
      return { x: 50, y: 50 };
    }

    // Random position within zone radius
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * zone.radius * 0.8;

    return {
      x: Math.floor(zone.position.x + Math.cos(angle) * distance),
      y: Math.floor(zone.position.y + Math.sin(angle) * distance),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // SAVE/LOAD
  // ═══════════════════════════════════════════════════════════════════════════════

  async saveStep(ctx: ActionCtx, engineUpdate: any): Promise<void> {
    const diff = this.takeDiff();
    await ctx.runMutation(internal.x402World.game.saveWorld, {
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
      if (!buffer) continue;
      historicalLocations.push({ agentId: id, location: buffer });
      bufferSize += buffer.byteLength;
    }

    this.historicalLocations.clear();

    const result: GameStateDiff = {
      world: { ...this.world.serialize(), historicalLocations },
      agentOperations: this.pendingOperations,
    };

    this.pendingOperations = [];

    if (this.descriptionsModified) {
      result.agentDescriptions = serializeMap(this.agentDescriptions);
      result.worldMap = this.worldMap.serialize();
      this.descriptionsModified = false;
    }

    return result;
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

    const engine = await db.get(worldStatus.engineId);
    if (!engine || engine.generationNumber !== generationNumber) {
      throw new Error('Generation number mismatch');
    }

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

    const { _id, _creationTime, historicalLocations: _, ...world } = worldDoc;
    const agentDescriptions = agentDescriptionsDocs
      .filter((d) => !!world.agents.find((a: any) => a.id === d.agentId))
      .map(({ _id, _creationTime, worldId: _, ...doc }) => doc);

    const { _id: _mapId, _creationTime: _mapCreationTime, worldId: _mapWorldId, ...worldMap } = worldMapDoc;

    return {
      engine,
      gameState: {
        world,
        agentDescriptions,
        worldMap,
      } as GameState,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONVEX FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

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
    engineUpdate: v.any(),
    worldId: v.id('worlds'),
    worldDiff: gameStateDiff,
  },
  handler: async (ctx, args) => {
    // Apply engine update
    await ctx.db.patch(args.engineId, args.engineUpdate);

    // Save world diff
    const existingWorld = await ctx.db.get(args.worldId);
    if (!existingWorld) {
      throw new Error(`No world found with id ${args.worldId}`);
    }

    await ctx.db.replace(args.worldId, args.worldDiff.world);

    // Update descriptions if changed
    if (args.worldDiff.agentDescriptions) {
      for (const description of args.worldDiff.agentDescriptions) {
        const existing = await ctx.db
          .query('agentDescriptions')
          .withIndex('worldId', (q) =>
            q.eq('worldId', args.worldId).eq('agentId', description.agentId)
          )
          .unique();

        if (existing) {
          await ctx.db.replace(existing._id, { worldId: args.worldId, ...description });
        } else {
          await ctx.db.insert('agentDescriptions', { worldId: args.worldId, ...description });
        }
      }
    }

    // Update map if changed
    if (args.worldDiff.worldMap) {
      const existingMap = await ctx.db
        .query('maps')
        .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
        .unique();

      if (existingMap) {
        await ctx.db.replace(existingMap._id, { worldId: args.worldId, ...args.worldDiff.worldMap });
      } else {
        await ctx.db.insert('maps', { worldId: args.worldId, ...args.worldDiff.worldMap });
      }
    }

    // Schedule agent operations
    for (const operation of args.worldDiff.agentOperations) {
      // Operations would be scheduled here
      console.log(`Scheduling operation: ${operation.name}`, operation.args);
    }
  },
});
