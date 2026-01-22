import { ObjectType, v } from 'convex/values';
import { Agent, serializedAgent } from './agent';
import { Transaction, serializedTransaction } from './transaction';
import { GameId, parseGameId, agentId, signalId } from './ids';
import { parseMap } from '../util/object';

// ═══════════════════════════════════════════════════════════════════════════════
// X402 WORLD STATE
// The living state of all agents, transactions, signals, and caravans
// ═══════════════════════════════════════════════════════════════════════════════

export const serializedSignal = {
  id: signalId,
  type: v.union(
    v.literal('buy'),
    v.literal('sell'),
    v.literal('swap'),
    v.literal('stake'),
    v.literal('delegate'),
    v.literal('service'),
    v.literal('data')
  ),
  source: agentId,
  target: v.optional(agentId),
  payload: v.any(),
  confidence: v.number(),
  priority: v.number(),
  expires: v.number(),
  created: v.number(),
  consumed: v.optional(v.number()),
  consumedBy: v.optional(agentId),
};

export type SerializedSignal = ObjectType<typeof serializedSignal>;

export class Signal {
  id: GameId<'signals'>;
  type: string;
  source: GameId<'agents'>;
  target?: GameId<'agents'>;
  payload: any;
  confidence: number;
  priority: number;
  expires: number;
  created: number;
  consumed?: number;
  consumedBy?: GameId<'agents'>;

  constructor(serialized: SerializedSignal) {
    this.id = parseGameId('signals', serialized.id);
    this.type = serialized.type;
    this.source = parseGameId('agents', serialized.source);
    this.target = serialized.target
      ? parseGameId('agents', serialized.target)
      : undefined;
    this.payload = serialized.payload;
    this.confidence = serialized.confidence;
    this.priority = serialized.priority;
    this.expires = serialized.expires;
    this.created = serialized.created;
    this.consumed = serialized.consumed;
    this.consumedBy = serialized.consumedBy
      ? parseGameId('agents', serialized.consumedBy)
      : undefined;
  }

  serialize(): SerializedSignal {
    return {
      id: this.id,
      type: this.type as any,
      source: this.source,
      target: this.target,
      payload: this.payload,
      confidence: this.confidence,
      priority: this.priority,
      expires: this.expires,
      created: this.created,
      consumed: this.consumed,
      consumedBy: this.consumedBy,
    };
  }
}

export const serializedCaravan = {
  id: v.string(),
  name: v.string(),
  status: v.union(
    v.literal('forming'),
    v.literal('ready'),
    v.literal('executing'),
    v.literal('settling'),
    v.literal('completed'),
    v.literal('failed')
  ),
  leader: agentId,
  participants: v.array(agentId),
  transactions: v.array(v.string()),
  totalValue: v.number(),
  strategy: v.string(),
  created: v.number(),
  executed: v.optional(v.number()),
  settled: v.optional(v.number()),
  mevProtection: v.boolean(),
  bundleSignature: v.optional(v.string()),
};

export type SerializedCaravan = ObjectType<typeof serializedCaravan>;

export class Caravan {
  id: GameId<'caravans'>;
  name: string;
  status: 'forming' | 'ready' | 'executing' | 'settling' | 'completed' | 'failed';
  leader: GameId<'agents'>;
  participants: GameId<'agents'>[];
  transactions: GameId<'transactions'>[];
  totalValue: number;
  strategy: string;
  created: number;
  executed?: number;
  settled?: number;
  mevProtection: boolean;
  bundleSignature?: string;

  constructor(serialized: SerializedCaravan) {
    this.id = parseGameId('caravans', serialized.id);
    this.name = serialized.name;
    this.status = serialized.status;
    this.leader = parseGameId('agents', serialized.leader);
    this.participants = serialized.participants.map(p => parseGameId('agents', p));
    this.transactions = serialized.transactions.map(t => parseGameId('transactions', t));
    this.totalValue = serialized.totalValue;
    this.strategy = serialized.strategy;
    this.created = serialized.created;
    this.executed = serialized.executed;
    this.settled = serialized.settled;
    this.mevProtection = serialized.mevProtection;
    this.bundleSignature = serialized.bundleSignature;
  }

  serialize(): SerializedCaravan {
    return {
      id: this.id,
      name: this.name,
      status: this.status,
      leader: this.leader,
      participants: this.participants,
      transactions: this.transactions,
      totalValue: this.totalValue,
      strategy: this.strategy,
      created: this.created,
      executed: this.executed,
      settled: this.settled,
      mevProtection: this.mevProtection,
      bundleSignature: this.bundleSignature,
    };
  }
}

export const historicalLocations = v.array(
  v.object({
    agentId,
    location: v.bytes(),
  }),
);

export const serializedWorld = {
  nextId: v.number(),
  // Agents can be in new X402 format or old AI Town format (for migration)
  // Using v.any() temporarily to support both formats during migration
  agents: v.any(), // Will be v.array(v.object(serializedAgent)) after migration
  // X402 World fields (optional for migration from old AI Town data)
  transactions: v.optional(v.array(v.object(serializedTransaction))),
  signals: v.optional(v.array(v.object(serializedSignal))),
  caravans: v.optional(v.array(v.object(serializedCaravan))),
  historicalLocations: v.optional(historicalLocations),

  // World-level metrics (optional for migration)
  totalTransactionVolume: v.optional(v.number()),
  totalTransactions: v.optional(v.number()),
  activeAgentCount: v.optional(v.number()),
  lastUpdated: v.optional(v.number()),

  // Legacy AI Town fields (optional for backward compatibility)
  players: v.optional(v.array(v.any())), // Old player format
  conversations: v.optional(v.array(v.any())), // Old conversation format
};

export type SerializedWorld = ObjectType<typeof serializedWorld>;

export class World {
  nextId: number;
  agents: Map<GameId<'agents'>, Agent>;
  transactions: Map<GameId<'transactions'>, Transaction>;
  signals: Map<GameId<'signals'>, Signal>;
  caravans: Map<GameId<'caravans'>, Caravan>;
  historicalLocations?: Map<GameId<'agents'>, ArrayBuffer>;

  totalTransactionVolume: number;
  totalTransactions: number;
  activeAgentCount: number;
  lastUpdated: number;

  constructor(serialized: SerializedWorld) {
    this.nextId = serialized.nextId;

    // Handle agents - may be in new X402 format or old AI Town format
    try {
      // Try to parse as new X402 format
      if (Array.isArray(serialized.agents) && serialized.agents.length > 0) {
        // Check if first agent has new format fields (walletAddress, balance, etc.)
        const firstAgent = serialized.agents[0];
        if (firstAgent && typeof firstAgent === 'object' && 'walletAddress' in firstAgent) {
          this.agents = parseMap(serialized.agents as any[], Agent, (a) => a.id);
        } else {
          // Old format - initialize empty (agents will be migrated separately)
          this.agents = new Map();
        }
      } else {
        this.agents = new Map();
      }
    } catch {
      // If parsing fails, initialize empty
      this.agents = new Map();
    }
    
    // Initialize X402 World collections with defaults if missing (migration support)
    this.transactions = parseMap(serialized.transactions || [], Transaction, (t) => t.id);
    this.signals = parseMap(serialized.signals || [], Signal, (s) => s.id);
    this.caravans = parseMap(serialized.caravans || [], Caravan, (c) => c.id);

    if (serialized.historicalLocations) {
      this.historicalLocations = new Map();
      for (const { agentId, location } of serialized.historicalLocations) {
        this.historicalLocations.set(parseGameId('agents', agentId), location);
      }
    }

    // Initialize metrics with defaults if missing (migration support)
    this.totalTransactionVolume = serialized.totalTransactionVolume ?? 0;
    this.totalTransactions = serialized.totalTransactions ?? 0;
    this.activeAgentCount = serialized.activeAgentCount ?? this.agents.size;
    this.lastUpdated = serialized.lastUpdated ?? Date.now();
  }

  // Get agent by ID
  getAgent(id: GameId<'agents'>): Agent | undefined {
    return this.agents.get(id);
  }

  // Get agents by role
  getAgentsByRole(role: string): Agent[] {
    return [...this.agents.values()].filter(a => a.role === role);
  }

  // Get active agents in a zone
  getAgentsInZone(zoneId: GameId<'zones'>): Agent[] {
    return [...this.agents.values()].filter(a => a.currentZone === zoneId);
  }

  // Get pending transactions for an agent
  getPendingTransactions(agentId: GameId<'agents'>): Transaction[] {
    return [...this.transactions.values()].filter(
      t => (t.senderId === agentId || t.receiverId === agentId) &&
           t.status === 'pending'
    );
  }

  // Get active signals
  getActiveSignals(now: number): Signal[] {
    return [...this.signals.values()].filter(
      s => !s.consumed && s.expires > now
    );
  }

  // Get active caravans
  getActiveCaravans(): Caravan[] {
    return [...this.caravans.values()].filter(
      c => c.status !== 'completed' && c.status !== 'failed'
    );
  }

  // Clean up expired signals
  cleanupExpiredSignals(now: number) {
    for (const [id, signal] of this.signals) {
      if (signal.expires < now && !signal.consumed) {
        this.signals.delete(id);
      }
    }
  }

  serialize(): SerializedWorld {
    return {
      nextId: this.nextId,
      agents: [...this.agents.values()].map((a) => a.serialize()),
      transactions: [...this.transactions.values()].map((t) => t.serialize()),
      signals: [...this.signals.values()].map((s) => s.serialize()),
      caravans: [...this.caravans.values()].map((c) => c.serialize()),
      historicalLocations: this.historicalLocations
        ? [...this.historicalLocations.entries()].map(([agentId, location]) => ({
            agentId,
            location,
          }))
        : undefined,
      totalTransactionVolume: this.totalTransactionVolume,
      totalTransactions: this.totalTransactions,
      activeAgentCount: this.agents.size,
      lastUpdated: Date.now(),
    };
  }
}
