import Dexie, { Table } from 'dexie';

// Define interfaces for the data to be stored in each table
// Based on convex/schema.ts and other relevant files

export interface World {
  id?: number; // Auto-incremented primary key by Dexie
  worldId: string; // Original Convex v.id('worlds')
  name: string;
  mapId: string; // Original Convex v.id('maps')
  engineId: string; // Original Convex v.id('engines')
  lastViewed?: number; // Timestamp for local management
}

export interface WorldStatus {
  id?: number;
  worldId: string; // Original Convex v.id('worlds')
  isDefault: boolean;
  status: string; // e.g., "running", "stopped"
  engineId: string; // Original Convex v.id('engines')
}

export interface MapData {
  id?: number;
  mapId: string; // Original Convex v.id('maps')
  worldId: string; // Original Convex v.id('worlds')
  // Store the actual map data, which could be large
  // For example, as a JSON string or a nested object if Dexie handles it well.
  // Based on convex/aiTown/worldMap.ts:Map
  width: number;
  height: number;
  tileSetUrl: string;
  // tileSetDim: number; // Replaced by tileSetDimX and tileSetDimY
  tileSetDimX: number; // Width of the tileset image in pixels
  tileSetDimY: number; // Height of the tileset image in pixels
  tileDim: number;
  bgTiles: number[][];
  objectTiles: number[][];
  animatedSprites?: { x: number; y: number; sheet: string; name: string }[]; // from editor/mapfile.js
}


export interface PlayerDescription {
  id?: number;
  playerDescriptionId: string; // Original Convex v.id('playerDescriptions')
  worldId: string; // Original Convex v.id('worlds')
  playerId: string; // Original Convex v.id('players')
  description: string;
  name: string;
  character: string; // Added character field
}

export interface AgentDescription {
  id?: number;
  agentDescriptionId: string; // Original Convex v.id('agentDescriptions')
  worldId: string; // Original Convex v.id('worlds')
  agentId: string; // Original Convex v.id('agents')
  description: string;
  name: string;
}

export interface Memory {
  id?: number;
  memoryId: string; // Original Convex v.id('memories')
  playerId: string; // Original Convex v.id('players') or v.id('agents')
  embeddingId: string; // Original Convex v.id('memoryEmbeddings')
  description: string; // data.description
  importance: number;
  lastAccess: number;
  data: { type: string; [key: string]: any }; // data field from schema
}

export interface MemoryEmbedding {
  id?: number;
  embeddingId: string; // Original Convex v.id('memoryEmbeddings')
  playerId: string; // Original Convex v.id('players') or v.id('agents')
  embedding: number[]; // Storing as number array, Float64Array not directly supported by IndexedDB in all browsers for querying
}

export interface EmbeddingsCache {
  id?: number;
  textHash: string; // textHash from schema (v.bytes()) - store as hex string or similar
  embedding: number[];
}

export interface Message {
  id?: number;
  messageUuid: string; // messageUuid from schema (v.string())
  conversationId: string; // Original Convex v.id('conversations')
  authorPlayerId: string; // Original Convex v.id('players')
  text: string;
  worldId: string; // Original Convex v.id('worlds')
  timestamp: number; // To store when the message was created or received
}

export interface ArchivedPlayer {
  id?: number;
  archivedPlayerId: string; // Original Convex v.id('archivedPlayers')
  worldId: string; // Original Convex v.id('worlds')
  playerId: string; // Original Convex v.id('players') - the original ID of the player
  data: any; // Serialized player data
}

export interface ArchivedConversation {
  id?: number;
  archivedConversationId: string; // Original Convex v.id('archivedConversations')
  worldId: string; // Original Convex v.id('worlds')
  conversationId: string; // Original Convex v.id('conversations') - the original ID
  data: any; // Serialized conversation data
}

export interface ArchivedAgent {
  id?: number;
  archivedAgentId: string; // Original Convex v.id('archivedAgents')
  worldId: string; // Original Convex v.id('worlds')
  agentId: string; // Original Convex v.id('agents') - the original ID
  data: any; // Serialized agent data
}

export interface ParticipatedTogether {
  id?: number;
  participatedTogetherId: string; // Original Convex v.id('participatedTogether')
  worldId: string; // Original Convex v.id('worlds')
  conversationId: string; // Original Convex v.id('conversations')
  player1Id: string; // Original Convex v.id('players')
  player2Id: string; // Original Convex v.id('players')
  ended: number; // Timestamp
}

export interface Input {
  id?: number;
  inputId: string; // Original Convex v.id('inputs')
  engineId: string; // Original Convex v.id('engines')
  number: number; // Corresponds to 'number' in schema
  name: string; // Corresponds to 'name' in schema, e.g., 'startConversation'
  args: any; // Corresponds to 'args' in schema (v.any())
}

export interface Engine {
  id?: number;
  engineId: string; // Original Convex v.id('engines')
  running: boolean;
  currentTime?: number; // To store the engine's current time if needed locally
}

export interface Music {
  id?: number;
  musicId: string; // Original Convex v.id('music')
  type: string; // e.g., "background", "event"
  url: string;
  isPlaying: boolean;
  volume?: number;
}


// Define the database class
export class MyGameDatabase extends Dexie {
// Import Serialized types from dataModels for table definitions
import type { SerializedPlayer } from '../dataModels/player';
import type { SerializedAgent } from '../dataModels/agent';
import type { SerializedConversation } from '../dataModels/conversation';


// Define the database class
export class MyGameDatabase extends Dexie {
  // Declare tables
  worlds!: Table<World, number>;
  worldStatus!: Table<WorldStatus, number>;
  maps!: Table<MapData, number>;
  playerDescriptions!: Table<PlayerDescription, number>;
  agentDescriptions!: Table<AgentDescription, number>;

  // New tables for game state
  players!: Table<SerializedPlayer & { id?: number; worldId: string; playerId: string }, number>; // Store SerializedPlayer, add worldId for indexing
  agents!: Table<SerializedAgent & { id?: number; worldId: string; agentId: string }, number>;     // Store SerializedAgent, add worldId for indexing
  conversations!: Table<SerializedConversation & { id?: number; worldId: string; conversationId: string }, number>; // Store SerializedConversation, add worldId

  memories!: Table<Memory, number>;
  memoryEmbeddings!: Table<MemoryEmbedding, number>;
  embeddingsCache!: Table<EmbeddingsCache, number>;
  messages!: Table<Message, number>;
  archivedPlayers!: Table<ArchivedPlayer, number>;
  archivedConversations!: Table<ArchivedConversation, number>;
  archivedAgents!: Table<ArchivedAgent, number>;
  participatedTogether!: Table<ParticipatedTogether, number>;
  inputs!: Table<Input, number>;
  engines!: Table<Engine, number>;
  music!: Table<Music, number>;

  constructor() {
    super('MyGameDatabase');
    this.version(1).stores({
      worlds: '++id, &worldId, mapId, engineId', // worldId should be unique
  worldStatus: '++id, &worldId, engineId, isDefault',
  maps: '++id, &mapId, worldId',
  playerDescriptions: '++id, &playerDescriptionId, worldId, playerId', // Added 'character' to interface, schema fine
      agentDescriptions: '++id, &agentDescriptionId, worldId, agentId',
  
  // Schema for new tables
  // For players, agents, conversations, we store the Serialized form.
  // The primary key 'id' is Dexie's auto-increment.
  // 'playerId', 'agentId', 'conversationId' are the game's unique string IDs.
  // 'worldId' is added for partitioning data by world.
  players: '++id, &playerId, worldId, human', // Index on playerId, worldId, and human status
  agents: '++id, &agentId, worldId, playerId',    // Index on agentId, worldId, and underlying playerId
  conversations: '++id, &conversationId, worldId, created', // Index on conversationId, worldId, and creation time

      memories: '++id, &memoryId, playerId, embeddingId, importance, lastAccess, &[playerId+data.type]',
      memoryEmbeddings: '++id, &embeddingId, playerId',
      embeddingsCache: '++id, &textHash', // textHash must be unique
      messages: '++id, &messageUuid, conversationId, authorPlayerId, worldId, [worldId+conversationId], timestamp',
      archivedPlayers: '++id, &archivedPlayerId, worldId, playerId',
      archivedConversations: '++id, &archivedConversationId, worldId, conversationId',
      archivedAgents: '++id, &archivedAgentId, worldId, agentId',
      participatedTogether: '++id, &participatedTogetherId, worldId, conversationId, player1Id, player2Id, ended, &[worldId+player1Id+player2Id+ended], &[worldId+player1Id+ended]',
      inputs: '++id, &inputId, engineId, &number, &[engineId+number]',
      engines: '++id, &engineId, running', // engineId should be unique
      music: '++id, &musicId, type', // musicId should be unique
    });
  }
}

// Instantiate the database
export const db = new MyGameDatabase();

// Example usage (optional, for testing or demonstration)
/*
db.on('populate', async () => {
  // This event fires only when the database is first created.
  // You can add some initial data here if needed.
  await db.worlds.add({
    worldId: 'sampleWorld1',
    name: 'Sample World',
    mapId: 'sampleMap1',
    engineId: 'sampleEngine1',
    lastViewed: Date.now(),
  });
});
*/

// Helper function to convert Uint8Array to hex string for textHash
export function uint8ArrayToHex(buffer: Uint8Array): string {
  return Array.prototype.map.call(buffer, x => ('00' + x.toString(16)).slice(-2)).join('');
}

// Helper function to convert hex string back to Uint8Array
export function hexToUint8Array(hexString: string): Uint8Array {
  if (hexString.length % 2 !== 0) {
    throw "Invalid hexString";
  }
  var arrayBuffer = new Uint8Array(hexString.length / 2);
  for (var i = 0; i < hexString.length; i += 2) {
    var byteValue = parseInt(hexString.substr(i, 2), 16);
    if (isNaN(byteValue)) {
      throw "Invalid hexString";
    }
    arrayBuffer[i/2] = byteValue;
  }
  return arrayBuffer;
}
