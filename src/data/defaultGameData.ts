import { WorldStatus, Engine, World, MapData, PlayerDescription, AgentDescription } from '../db';

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
    tileDim: 16, // Dimension of a single tile in pixels
    bgTiles: [], // For simplicity, keeping these empty. Could be populated from tilemap.json later.
    objectTiles: [],
    animatedSprites: [],
  }
];

export const defaultPlayerDescriptions: PlayerDescription[] = [
  {
    playerDescriptionId: "playerdesc1",
    worldId: defaultWorldId,
    playerId: "player1",
    name: "Adventurer Alice",
    description: "A brave explorer ready to chart the unknown.",
    // 'character' field from prompt is not in db.ts PlayerDescription interface.
  },
  {
    playerDescriptionId: "playerdesc2",
    worldId: defaultWorldId,
    playerId: "player2",
    name: "Sorcerer Bob",
    description: "A wise mage searching for ancient secrets.",
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
