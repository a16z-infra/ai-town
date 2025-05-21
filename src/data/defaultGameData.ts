import { WorldStatus, Engine, World, MapData, PlayerDescription, AgentDescription } from '../db';
// Import Serialized types for default empty arrays
import type { SerializedPlayer } from '../dataModels/player';
import type { SerializedAgent } from '../dataModels/agent';
import type { SerializedConversation } from '../dataModels/conversation';


export const defaultWorldId = "defaultWorld";
export const defaultEngineId = "defaultEngine";
export const defaultMapId = "defaultMap";

export const defaultWorldStatus: WorldStatus[] = [
  {
    worldId: defaultWorldId,
    engineId: defaultEngineId,
    isDefault: true, // Store as boolean, Dexie handles it for IndexedDB (often as 1)
    status: "running",
  }
];

export const defaultEngines: Engine[] = [
  {
    engineId: defaultEngineId,
    running: true,
    currentTime: 0,
    // The following fields were in the prompt but not in the db.ts Engine interface.
    // lastStepTs: 0,
    // processedInputNumber: -1,
    // generationNumber: 0,
    // If these are needed by useHistoricalTime, the Engine interface in db.ts
    // and the table schema should be updated. For now, sticking to the interface.
  }
];

export const defaultWorlds: World[] = [
  {
    worldId: defaultWorldId,
    name: "Default World",
    mapId: defaultMapId,
    engineId: defaultEngineId,
    lastViewed: Date.now(),
    // Fields like nextId, conversations, players, agents from SerializedWorld
    // are not part of the World interface in db.ts.
    // Sticking to the db.ts interface.
  }
];

export const defaultMaps: MapData[] = [
  {
    mapId: defaultMapId,
    worldId: defaultWorldId,
    width: 40, // In tiles
    height: 40, // In tiles
    tileSetUrl: 'assets/rpg-tileset.png', // Path to the tileset image
    tileSetDimX: 1600, // Example: If tileset is 100 tiles wide * 16px/tile
    tileSetDimY: 1600, // Example: If tileset is 100 tiles high * 16px/tile
    tileDim: 16, // Dimension of a single tile in pixels
    // bgTiles and objectTiles are number[][], which is a single layer.
    // The WorldMap class expects TileLayer[] (number[][][]).
    // For default data, an empty single layer is fine.
    // The transformation to number[][][] will happen in useClientGame if needed.
    bgTiles: Array(40).fill(null).map(() => Array(40).fill(0)), // Example empty layer
    objectTiles: Array(40).fill(null).map(() => Array(40).fill(0)), // Example empty layer
    animatedSprites: [],
  }
];

export const defaultPlayerDescriptions: PlayerDescription[] = [
  {
    playerDescriptionId: "playerdesc1",
    worldId: defaultWorldId,
    playerId: "player1", // This should match a playerId in defaultPlayers if any
    name: "Adventurer Alice",
    description: "A brave explorer ready to chart the unknown.",
    character: "f1", // Example character sprite name
  },
  {
    playerDescriptionId: "playerdesc2",
    worldId: defaultWorldId,
    playerId: "player2", // This should match a playerId in defaultPlayers if any
    name: "Sorcerer Bob",
    description: "A wise mage searching for ancient secrets.",
    character: "m1", // Example character sprite name
  }
];

export const defaultAgentDescriptions: AgentDescription[] = [
  {
    agentDescriptionId: "agentdesc1",
    worldId: defaultWorldId,
    agentId: "agent1",
    name: "Friendly Guide", // 'name' field from db.ts interface
    description: "Always happy to help newcomers. Knows a lot about this world.", // 'description' field (was identity/plan in prompt)
  },
  {
    agentDescriptionId: "agentdesc2",
    worldId: defaultWorldId,
    agentId: "agent2",
    name: "Grumpy Shopkeeper",
    description: "Sells various goods, but isn't very talkative. Secretly yearns for adventure.",
  }
];

// Other tables can be seeded with empty arrays or minimal data if needed.
// For example:
// export const defaultMessages: Message[] = [];
// export const defaultMemories: Memory[] = [];
// ... and so on for all other tables defined in db.ts
// This ensures all tables are created by Dexie even if not explicitly seeded here.
// However, bulkAdd with an empty array is a no-op.
// Dexie creates tables based on version().stores(), not on whether they are seeded.

// Default empty arrays for new tables
export const defaultPlayers: SerializedPlayer[] = [
  // Example player (ensure format matches SerializedPlayer from dataModels/player.ts)
  // {
  //   id: "p:1" as any, // PlayerId from dataModels/ids.ts
  //   human: undefined, // Optional: tokenIdentifier for human players
  //   pathfinding: undefined,
  //   activity: { description: "Wandering", emoji: "🤔", until: Date.now() + 60000 },
  //   lastInput: Date.now(),
  //   position: { x: 20, y: 20 }, // Example position
  //   facing: { dx: 0, dy: 1 },   // Example facing direction
  //   speed: 0,
  //   worldId: defaultWorldId, // Not part of SerializedPlayer, but needed for DB query if table uses it
  //   playerId: "p:1" // Redundant with 'id' but added to table for indexing
  // }
  // For seeding, ensure 'playerId' matches 'id' if both are stored.
  // The table schema for 'players' in db.ts is:
  // players!: Table<SerializedPlayer & { id?: number; worldId: string; playerId: string }, number>;
  // So, the object should be SerializedPlayer, and worldId/playerId are for indexing/querying.
  // We can add players here if we want them to exist by default.
  // For now, let's seed it empty, players will be created via UI or other logic.
];

export const defaultAgents: SerializedAgent[] = [
  // Example agent (ensure format matches SerializedAgent from dataModels/agent.ts)
  // {
  //   id: "a:1" as any, // AgentId
  //   playerId: "p:agentPlayer1" as any, // Underlying PlayerId for this agent
  //   worldId: defaultWorldId, // Not part of SerializedAgent, but for DB query
  //   agentId: "a:1" // Redundant with 'id'
  // }
  // Seed empty for now. Agents are often tied to AgentDescriptions.
];

export const defaultConversations: SerializedConversation[] = [
  // Seed empty for now. Conversations are dynamic.
];
