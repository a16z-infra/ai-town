import { ObjectType, v } from 'convex/values';
import { GameId, parseGameId, agentId, zoneId } from './ids';
import { Game } from './game';

// ═══════════════════════════════════════════════════════════════════════════════
// X402 WORLD AGENTS
// Autonomous entities that transact, service, and develop within X402 World
//
// AGENT HIERARCHY (adapted from Gas Town):
// - ORACLE: Chief orchestrator, routes all requests (Mayor)
// - MIXER: Transaction aggregation & MEV protection (Refinery)
// - WATCHER: Monitors all agents, ensures completion (Witness)
// - RECURSION: The daemon, propagates signals (Deacon)
// - NODE: General purpose trading/service agents (Polecats)
// - SENTINEL: Security & validation agents (Dogs)
// - DIAMOND: User's personal trusted agents (Crew)
// ═══════════════════════════════════════════════════════════════════════════════

export type AgentRole =
  | 'oracle'      // Chief concierge - routes requests
  | 'mixer'       // Aggregates transactions, MEV protection
  | 'watcher'     // Monitors all agents
  | 'recursion'   // The daemon heartbeat
  | 'node'        // General trading agents
  | 'sentinel'    // Security agents
  | 'diamond'     // User's trusted agents
  | 'specialist'; // Domain-specific agents

export type AgentState =
  | 'idle'
  | 'scanning'
  | 'analyzing'
  | 'transacting'
  | 'settling'
  | 'learning'
  | 'sleeping'
  | 'recycling';

export const serializedAgent = {
  id: agentId,
  role: v.union(
    v.literal('oracle'),
    v.literal('mixer'),
    v.literal('watcher'),
    v.literal('recursion'),
    v.literal('node'),
    v.literal('sentinel'),
    v.literal('diamond'),
    v.literal('specialist')
  ),
  state: v.union(
    v.literal('idle'),
    v.literal('scanning'),
    v.literal('analyzing'),
    v.literal('transacting'),
    v.literal('settling'),
    v.literal('learning'),
    v.literal('sleeping'),
    v.literal('recycling')
  ),

  // Identity
  name: v.string(),
  walletAddress: v.string(),
  publicKey: v.string(),

  // Position in world
  position: v.object({
    x: v.number(),
    y: v.number(),
  }),
  facing: v.object({
    dx: v.number(),
    dy: v.number(),
  }),
  currentZone: v.optional(zoneId),

  // Movement
  pathfinding: v.optional(v.object({
    destination: v.object({ x: v.number(), y: v.number() }),
    started: v.number(),
    state: v.union(
      v.object({ kind: v.literal('needsPath') }),
      v.object({ kind: v.literal('waiting'), until: v.number() }),
      v.object({ kind: v.literal('moving'), path: v.any() }),
    ),
  })),

  // X402 Protocol
  balance: v.object({
    sol: v.number(),
    usdc: v.number(),
    x402: v.number(),
  }),
  escrowBalance: v.number(),
  totalEarned: v.number(),
  totalSpent: v.number(),

  // Service capabilities
  capabilities: v.array(v.string()),
  serviceEndpoint: v.optional(v.string()),
  pricePerRequest: v.number(),

  // Performance metrics
  reputation: v.number(),
  successRate: v.number(),
  totalTransactions: v.number(),
  totalServiced: v.number(),

  // Recursion (RALPH) state
  recursionDepth: v.number(),
  maxRecursionDepth: v.number(),
  currentThought: v.optional(v.string()),
  confidence: v.number(),

  // Activity
  lastActive: v.number(),
  lastTransaction: v.optional(v.number()),
  lastService: v.optional(v.number()),
  currentTask: v.optional(v.object({
    type: v.string(),
    target: v.optional(v.string()),
    started: v.number(),
    deadline: v.optional(v.number()),
  })),

  // Operator control
  operatorId: v.optional(v.string()),
  isAutonomous: v.boolean(),

  // Lifecycle
  created: v.number(),
  lastMaintenance: v.number(),
  expiresAt: v.optional(v.number()),
};

export type SerializedAgent = ObjectType<typeof serializedAgent>;

export class Agent {
  id: GameId<'agents'>;
  role: AgentRole;
  state: AgentState;
  name: string;
  walletAddress: string;
  publicKey: string;

  position: { x: number; y: number };
  facing: { dx: number; dy: number };
  currentZone?: GameId<'zones'>;
  pathfinding?: {
    destination: { x: number; y: number };
    started: number;
    state:
      | { kind: 'needsPath' }
      | { kind: 'waiting'; until: number }
      | { kind: 'moving'; path: any };
  };

  balance: { sol: number; usdc: number; x402: number };
  escrowBalance: number;
  totalEarned: number;
  totalSpent: number;

  capabilities: string[];
  serviceEndpoint?: string;
  pricePerRequest: number;

  reputation: number;
  successRate: number;
  totalTransactions: number;
  totalServiced: number;

  recursionDepth: number;
  maxRecursionDepth: number;
  currentThought?: string;
  confidence: number;

  lastActive: number;
  lastTransaction?: number;
  lastService?: number;
  currentTask?: {
    type: string;
    target?: string;
    started: number;
    deadline?: number;
  };

  operatorId?: string;
  isAutonomous: boolean;

  created: number;
  lastMaintenance: number;
  expiresAt?: number;

  constructor(serialized: SerializedAgent) {
    this.id = parseGameId('agents', serialized.id);
    this.role = serialized.role;
    this.state = serialized.state;
    this.name = serialized.name;
    this.walletAddress = serialized.walletAddress;
    this.publicKey = serialized.publicKey;

    this.position = serialized.position;
    this.facing = serialized.facing;
    this.currentZone = serialized.currentZone
      ? parseGameId('zones', serialized.currentZone)
      : undefined;
    this.pathfinding = serialized.pathfinding;

    this.balance = serialized.balance;
    this.escrowBalance = serialized.escrowBalance;
    this.totalEarned = serialized.totalEarned;
    this.totalSpent = serialized.totalSpent;

    this.capabilities = serialized.capabilities;
    this.serviceEndpoint = serialized.serviceEndpoint;
    this.pricePerRequest = serialized.pricePerRequest;

    this.reputation = serialized.reputation;
    this.successRate = serialized.successRate;
    this.totalTransactions = serialized.totalTransactions;
    this.totalServiced = serialized.totalServiced;

    this.recursionDepth = serialized.recursionDepth;
    this.maxRecursionDepth = serialized.maxRecursionDepth;
    this.currentThought = serialized.currentThought;
    this.confidence = serialized.confidence;

    this.lastActive = serialized.lastActive;
    this.lastTransaction = serialized.lastTransaction;
    this.lastService = serialized.lastService;
    this.currentTask = serialized.currentTask;

    this.operatorId = serialized.operatorId;
    this.isAutonomous = serialized.isAutonomous;

    this.created = serialized.created;
    this.lastMaintenance = serialized.lastMaintenance;
    this.expiresAt = serialized.expiresAt;
  }

  tick(game: Game, now: number) {
    // Update last active
    this.lastActive = now;

    // Check if agent should expire (ephemeral agents)
    if (this.expiresAt && now > this.expiresAt) {
      this.state = 'recycling';
    }

    // State machine for agent behavior
    switch (this.state) {
      case 'idle':
        this.tickIdle(game, now);
        break;
      case 'scanning':
        this.tickScanning(game, now);
        break;
      case 'analyzing':
        this.tickAnalyzing(game, now);
        break;
      case 'transacting':
        this.tickTransacting(game, now);
        break;
      case 'settling':
        this.tickSettling(game, now);
        break;
      case 'learning':
        this.tickLearning(game, now);
        break;
      case 'sleeping':
        this.tickSleeping(game, now);
        break;
      case 'recycling':
        this.tickRecycling(game, now);
        break;
    }
  }

  private tickIdle(game: Game, now: number) {
    // Look for work based on role
    if (this.isAutonomous && this.role === 'node') {
      // Check for pending signals to consume
      const signals = [...game.world.signals.values()];
      const mySignal = signals.find(s =>
        !s.consumed &&
        s.expires > now &&
        this.canHandleSignal(s)
      );

      if (mySignal) {
        this.state = 'scanning';
        this.currentTask = {
          type: 'process_signal',
          target: mySignal.id,
          started: now,
        };
      }
    }
  }

  private tickScanning(game: Game, now: number) {
    // Scan for opportunities, validate targets
    const taskDuration = now - (this.currentTask?.started || now);
    if (taskDuration > 5000) {
      // Move to analysis phase
      this.state = 'analyzing';
      this.recursionDepth = 1;
    }
  }

  private tickAnalyzing(game: Game, now: number) {
    // RALPH - Recursive Alpha Loop Processing Heuristic
    // "If hook has work, MUST RUN IT"

    const taskDuration = now - (this.currentTask?.started || now);

    // Increase recursion depth for deeper analysis
    if (this.recursionDepth < this.maxRecursionDepth && this.confidence < 85) {
      this.recursionDepth++;
      this.currentThought = this.generateThought();
      this.confidence = Math.min(99, this.confidence + 10 + Math.random() * 5);
    }

    // Once confident enough, transition to transacting
    if (this.confidence >= 85 || this.recursionDepth >= this.maxRecursionDepth) {
      this.state = 'transacting';
    }
  }

  private tickTransacting(game: Game, now: number) {
    // Execute the transaction
    // This is where X402 protocol payments happen
    const taskDuration = now - (this.currentTask?.started || now);

    if (taskDuration > 3000) {
      this.state = 'settling';
    }
  }

  private tickSettling(game: Game, now: number) {
    // Wait for transaction confirmation
    const taskDuration = now - (this.currentTask?.started || now);

    if (taskDuration > 2000) {
      // Mark transaction complete
      this.totalTransactions++;
      this.lastTransaction = now;

      // Reset state
      this.state = 'learning';
      this.currentThought = 'Analyzing transaction outcome...';
    }
  }

  private tickLearning(game: Game, now: number) {
    // Learn from the interaction
    const taskDuration = now - (this.currentTask?.started || now);

    if (taskDuration > 1000) {
      // Update success rate
      const success = Math.random() > 0.2; // 80% success rate simulation
      if (success) {
        this.successRate = this.successRate * 0.95 + 0.05;
        this.reputation = Math.min(100, this.reputation + 0.1);
      } else {
        this.successRate = this.successRate * 0.95;
        this.reputation = Math.max(0, this.reputation - 0.5);
      }

      // Return to idle
      this.state = 'idle';
      this.currentTask = undefined;
      this.confidence = 50;
      this.recursionDepth = 0;
      this.currentThought = undefined;
    }
  }

  private tickSleeping(game: Game, now: number) {
    // Low-power state, check periodically if needed
    if (Math.random() > 0.99) {
      this.state = 'idle';
    }
  }

  private tickRecycling(game: Game, now: number) {
    // Agent is being decommissioned
    // Transfer any remaining balance, clean up state
    game.scheduleOperation('recycleAgent', { agentId: this.id });
  }

  private canHandleSignal(signal: any): boolean {
    // Check if this agent has the capability to handle this signal type
    return this.capabilities.includes(signal.type) ||
           this.capabilities.includes('*');
  }

  private generateThought(): string {
    const thoughts = [
      'Analyzing market microstructure...',
      'Evaluating counterparty reputation...',
      'Calculating optimal execution path...',
      'Simulating MEV protection strategies...',
      'Assessing liquidity depth...',
      'Running risk analysis...',
      'Optimizing transaction parameters...',
      'Validating signal integrity...',
    ];
    return thoughts[Math.floor(Math.random() * thoughts.length)];
  }

  serialize(): SerializedAgent {
    return {
      id: this.id,
      role: this.role,
      state: this.state,
      name: this.name,
      walletAddress: this.walletAddress,
      publicKey: this.publicKey,
      position: this.position,
      facing: this.facing,
      currentZone: this.currentZone,
      pathfinding: this.pathfinding,
      balance: this.balance,
      escrowBalance: this.escrowBalance,
      totalEarned: this.totalEarned,
      totalSpent: this.totalSpent,
      capabilities: this.capabilities,
      serviceEndpoint: this.serviceEndpoint,
      pricePerRequest: this.pricePerRequest,
      reputation: this.reputation,
      successRate: this.successRate,
      totalTransactions: this.totalTransactions,
      totalServiced: this.totalServiced,
      recursionDepth: this.recursionDepth,
      maxRecursionDepth: this.maxRecursionDepth,
      currentThought: this.currentThought,
      confidence: this.confidence,
      lastActive: this.lastActive,
      lastTransaction: this.lastTransaction,
      lastService: this.lastService,
      currentTask: this.currentTask,
      operatorId: this.operatorId,
      isAutonomous: this.isAutonomous,
      created: this.created,
      lastMaintenance: this.lastMaintenance,
      expiresAt: this.expiresAt,
    };
  }
}
