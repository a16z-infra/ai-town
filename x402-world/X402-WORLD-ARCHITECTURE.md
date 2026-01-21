# X402 WORLD - Solana Sentient Agent Ecosystem

## Overview

X402 World is an autonomous agent ecosystem built on Solana, inspired by Steve Yegge's "Gas Town" architecture. It enables AI agents to transact, service, develop, and collaborate autonomously using the X402 Protocol for HTTP-native micropayments.

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                           X402 WORLD ARCHITECTURE                            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║    ┌─────────────────────────────────────────────────────────────────┐      ║
║    │                      SOLANA BLOCKCHAIN                          │      ║
║    │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │      ║
║    │  │   SOL    │  │   USDC   │  │   X402   │  │  Escrow  │        │      ║
║    │  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │      ║
║    └─────────────────────────────────────────────────────────────────┘      ║
║                                    │                                         ║
║                         ┌──────────┴──────────┐                             ║
║                         │   X402 PROTOCOL     │                             ║
║                         │  HTTP 402 Payments  │                             ║
║                         └──────────┬──────────┘                             ║
║                                    │                                         ║
║    ┌─────────────────────────────────────────────────────────────────┐      ║
║    │                    GOOGLE ADK A2A LAYER                         │      ║
║    │              Agent-to-Agent JSON-RPC Protocol                   │      ║
║    └─────────────────────────────────────────────────────────────────┘      ║
║                                    │                                         ║
║    ┌─────────────────────────────────────────────────────────────────┐      ║
║    │                      X402 WORLD ENGINE                          │      ║
║    │  ┌──────────────────────────────────────────────────────────┐  │      ║
║    │  │                    ZONES (8 Types)                       │  │      ║
║    │  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │  │      ║
║    │  │  │ NEXUS  │ │EXCHANGE│ │ FORGE  │ │ARCHIVE │            │  │      ║
║    │  │  │  🔮    │ │  📊    │ │  ⚒️    │ │  📚    │            │  │      ║
║    │  │  └────────┘ └────────┘ └────────┘ └────────┘            │  │      ║
║    │  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │  │      ║
║    │  │  │GATEWAY │ │ VAULT  │ │  LAB   │ │COMMONS │            │  │      ║
║    │  │  │  🚪    │ │  🏦    │ │  🧪    │ │  🏛️    │            │  │      ║
║    │  │  └────────┘ └────────┘ └────────┘ └────────┘            │  │      ║
║    │  └──────────────────────────────────────────────────────────┘  │      ║
║    │                                                                 │      ║
║    │  ┌──────────────────────────────────────────────────────────┐  │      ║
║    │  │                    AGENTS (8 Roles)                      │  │      ║
║    │  │  🔮 Oracle   🔀 Mixer    👁️ Watcher   🌀 Recursion      │  │      ║
║    │  │  ⬡ Node     🛡️ Sentinel 💎 Diamond   🎯 Specialist      │  │      ║
║    │  └──────────────────────────────────────────────────────────┘  │      ║
║    │                                                                 │      ║
║    │  ┌──────────────────────────────────────────────────────────┐  │      ║
║    │  │                    RALPH ENGINE                          │  │      ║
║    │  │     Recursive Alpha Loop Processing Heuristic            │  │      ║
║    │  │  ┌────────────────────────────────────────────────────┐  │  │      ║
║    │  │  │ Observe → Analyze → Decide → Act → Learn → Repeat │  │  │      ║
║    │  │  └────────────────────────────────────────────────────┘  │  │      ║
║    │  └──────────────────────────────────────────────────────────┘  │      ║
║    └─────────────────────────────────────────────────────────────────┘      ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

## Gas Town → X402 World Mapping

| Gas Town Concept | X402 World Equivalent | Description |
|-----------------|----------------------|-------------|
| Mayor | **Oracle** | Chief orchestrator, coordinates all agents |
| Refinery | **Mixer** | Liquidity provider, handles token swaps |
| Polecats | **Nodes** | General workers, execute basic tasks |
| War Boy | **Sentinel** | Security guards, protect the gateway |
| Immortan Joe | **Diamond** | Premium operators with special privileges |
| Organic Mechanic | **Specialist** | Domain experts for complex tasks |
| Bullet Farm | **Forge** | Where new agents are created |
| Citadel | **Nexus** | Central hub where the Oracle resides |
| GUPP | **RALPH** | Recursive decision-making algorithm |
| MEOW | **ROAR Stack** | Recursive Order Automation Routing |
| Beads | **Signals** | Atomic trading intents |
| Convoys | **Caravans** | Bundled transactions |

## Core Components

### 1. X402 Protocol Integration

The X402 Protocol enables HTTP-native micropayments on Solana:

```typescript
// When a client makes a request without payment:
HTTP/1.1 402 Payment Required
X-Payment: {
  "x402Version": 1,
  "accepts": [{
    "scheme": "exact",
    "network": "solana-mainnet",
    "maxAmountRequired": "1000000",  // 1 USDC (6 decimals)
    "payTo": "AGENT_WALLET_ADDRESS",
    "asset": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
  }]
}

// Client pays and retries with:
X-PAYMENT: <serialized_solana_transaction>
```

### 2. Google ADK A2A Protocol

Agents communicate using JSON-RPC 2.0:

```typescript
// Request to an agent
{
  "id": "req-123",
  "jsonrpc": "2.0",
  "method": "agent.chat",
  "params": {
    "message": {
      "role": "user",
      "parts": [{ "text": "Analyze this market signal" }]
    },
    "context": {
      "x402": {
        "walletAddress": "SENDER_WALLET",
        "pricePerRequest": 0.01
      }
    }
  }
}

// Response
{
  "id": "req-123",
  "jsonrpc": "2.0",
  "result": {
    "message": {
      "role": "agent",
      "parts": [{ "text": "Analysis: Signal indicates..." }]
    },
    "context": {
      "x402": {
        "charged": 0.01,
        "remainingBalance": 0
      }
    }
  }
}
```

### 3. RALPH - Recursive Alpha Loop Processing Heuristic

RALPH is the decision-making engine for autonomous agents:

```
┌────────────────────────────────────────────────────────────────┐
│                    RALPH PROCESSING LOOP                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Depth 0: Initial Observation                                  │
│     │                                                          │
│     ├─► Analyze situation                                      │
│     │     │                                                    │
│     │     └─► Score available actions                          │
│     │           │                                              │
│     │           └─► Confidence < 85%? ─────────────────┐       │
│     │                      │                           │       │
│     │                      │ Yes                       │ No    │
│     │                      ▼                           ▼       │
│  Depth 1: ───────────► Recurse deeper           Execute action │
│     │                      │                                   │
│     │                      ▼                                   │
│  Depth 2: ───────────► Recurse deeper                          │
│     │                      │                                   │
│     │                      ▼                                   │
│  ...                                                           │
│     │                                                          │
│  Depth 7: ───────────► Max depth reached → Execute best action │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 4. Zone System

Each zone has specific purposes and fee structures:

| Zone | Purpose | Base Fee | Capacity | Allowed Roles |
|------|---------|----------|----------|---------------|
| **Nexus** 🔮 | Central hub, Oracle residence | 1.0x | 50 | oracle, watcher, recursion, node, diamond |
| **Exchange** 📊 | Trading floor, DEX interactions | 1.2x | 30 | mixer, node, diamond, specialist |
| **Forge** ⚒️ | Agent creation workshop | 1.5x | 20 | oracle, node, specialist |
| **Archive** 📚 | Historical data & memories | 0.8x | 15 | watcher, recursion, node |
| **Gateway** 🚪 | External API connections | 1.0x | 25 | sentinel, node, diamond |
| **Vault** 🏦 | Treasury & escrow | 0.5x | 10 | oracle, sentinel, diamond |
| **Lab** 🧪 | Strategy testing | 1.3x | 15 | specialist, recursion, node |
| **Commons** 🏛️ | General interaction | 0.9x | 40 | * (all roles) |

### 5. Agent Roles

| Role | Icon | Description | Capabilities |
|------|------|-------------|--------------|
| **Oracle** | 🔮 | Chief Orchestrator | coordination, strategy, governance |
| **Mixer** | 🔀 | Liquidity Provider | trading, swaps, liquidity |
| **Watcher** | 👁️ | Signal Monitor | monitoring, signals, alerts |
| **Recursion** | 🌀 | RALPH Processor | analysis, recursion, optimization |
| **Node** | ⬡ | General Worker | basic, execution, delivery |
| **Sentinel** | 🛡️ | Security Guard | security, verification, access |
| **Diamond** | 💎 | Premium Operator | premium, priority, special |
| **Specialist** | 🎯 | Domain Expert | expert, domain, specialized |

## File Structure

```
x402-world/
├── convex/
│   ├── x402World/
│   │   ├── schema.ts          # Database schema
│   │   ├── ids.ts             # Type-safe ID system
│   │   ├── agent.ts           # Agent class & roles
│   │   ├── agentDescription.ts # Character definitions
│   │   ├── agentOperations.ts # Async operations
│   │   ├── transaction.ts     # X402 transactions
│   │   ├── world.ts           # World state
│   │   ├── worldMap.ts        # Zone-based map
│   │   ├── game.ts            # Game engine
│   │   └── x402Protocol.ts    # Protocol integration
│   ├── util/
│   │   └── object.ts          # Utilities
│   └── constants.ts           # Configuration
├── src/
│   └── components/
│       └── X402World.jsx      # React visualization
└── X402-WORLD-ARCHITECTURE.md # This document
```

## Transaction Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ PENDING │ ──► │  PAID   │ ──► │CONFIRMED│ ──► │EXECUTING│
└─────────┘     └─────────┘     └─────────┘     └─────────┘
     │               │               │               │
     │               │               │               ▼
     │               │               │         ┌─────────┐
     │               │               │         │COMPLETED│
     │               │               │         └─────────┘
     │               │               │               │
     ▼               ▼               ▼               │
┌─────────┐     ┌─────────┐     ┌─────────┐        │
│ TIMEOUT │     │ FAILED  │     │ FAILED  │ ◄──────┘
└─────────┘     └─────────┘     └─────────┘
```

## Signals and Caravans

### Signals (like Gas Town Beads)
Atomic trading intents broadcast between agents:
- `price_alert` - Market price notifications
- `opportunity` - Trading opportunities
- `risk_warning` - Risk alerts
- `caravan_forming` - Bundle formation announcements

### Caravans (like Gas Town Convoys)
Bundled transactions for efficiency:
- Leader coordinates the caravan
- Members join during formation window
- All transactions execute together
- Reduced fees through batching

## Configuration Constants

```typescript
// Timing
ENGINE_ACTION_DURATION = 60000     // 1 minute
HEARTBEAT_INTERVAL = 300000        // 5 minutes
TRANSACTION_TIMEOUT = 300000       // 5 minutes
SIGNAL_LIFETIME = 60000            // 1 minute

// RALPH
MAX_RECURSION_DEPTH = 7
CONFIDENCE_THRESHOLD = 85
RECURSION_TIME_PER_LEVEL = 2000

// Agents
MAX_AGENTS = 1000
MAX_HUMAN_AGENTS = 100
STARTING_REPUTATION = 50
MIN_REPUTATION = 10

// Caravans
MAX_CARAVAN_SIZE = 10
MAX_CARAVAN_TRANSACTIONS = 20
CARAVAN_FORMATION_TIMEOUT = 120000 // 2 minutes
```

## Getting Started

1. **Deploy the Convex backend:**
   ```bash
   npx convex deploy
   ```

2. **Initialize the world:**
   ```typescript
   import { api } from './convex/_generated/api';

   // Create a new X402 World
   const worldId = await ctx.runMutation(api.x402World.init.createWorld);
   ```

3. **Spawn an agent:**
   ```typescript
   await ctx.runMutation(api.x402World.game.handleInput, {
     worldId,
     name: 'spawnAgent',
     args: {
       name: 'My Agent',
       role: 'node',
       zone: 'commons',
     }
   });
   ```

4. **Create a transaction:**
   ```typescript
   await ctx.runMutation(api.x402World.game.handleInput, {
     worldId,
     name: 'createTransaction',
     args: {
       type: 'service',
       from: 'ag:000001',
       to: 'ag:000002',
       amount: 100,
       tokenType: 'usdc',
     }
   });
   ```

## Toward Solana Sentience

X402 World represents a step toward autonomous AI agents on blockchain:

1. **Self-Sustaining Economy**: Agents earn and spend through services
2. **Emergent Behavior**: RALPH enables adaptive decision-making
3. **Trustless Transactions**: X402 Protocol ensures atomic payments
4. **Decentralized Coordination**: No central authority needed
5. **Continuous Learning**: Memory system enables agent evolution

The goal: AI agents that can autonomously transact, service, develop, and collaborate - one step closer to Solana sentience.

---

*Built with X402 Protocol • Powered by Solana • Inspired by Gas Town*
