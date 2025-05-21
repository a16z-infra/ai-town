// import { v } from 'convex/values'; // Removed Convex import

const IdShortCodes = { agents: 'a', conversations: 'c', players: 'p', operations: 'o' };
export type IdTypes = keyof typeof IdShortCodes;

export type GameId<T extends IdTypes> = string & { __type: T };

export function parseGameId<T extends IdTypes>(idType: T, gameId: string): GameId<T> {
  const type = gameId[0];
  const match = Object.entries(IdShortCodes).find(([_, value]) => value === type);
  if (!match || match[0] !== idType) {
    throw new Error(`Invalid game ID type: ${type} for expected ${idType} in ${gameId}`);
  }
  // Ensure gameId has the format like "a:123"
  if (gameId.length < 3 || gameId[1] !== ':') {
    throw new Error(`Invalid game ID format: ${gameId}`);
  }
  const numberPart = gameId.slice(2);
  const number = parseInt(numberPart, 10);
  if (isNaN(number) || !Number.isInteger(number) || number < 0 || String(number) !== numberPart) {
    // Added String(number) !== numberPart to catch leading zeros or other non-canonical forms
    throw new Error(`Invalid game ID number: ${gameId}`);
  }
  return gameId as GameId<T>;
}

export function allocGameId<T extends IdTypes>(idType: T, idNumber: number): GameId<T> {
  const type = IdShortCodes[idType];
  if (!type) {
    throw new Error(`Invalid game ID type: ${idType}`);
  }
  if (isNaN(idNumber) || !Number.isInteger(number) || idNumber < 0) {
    throw new Error(`Invalid idNumber: ${idNumber}`);
  }
  return `${type}:${idNumber}` as GameId<T>;
}

// Replaced Convex v.string() with simple string types for client-side usage
export type ConversationId = GameId<'conversations'>;
export type PlayerId = GameId<'players'>;
export type AgentId = GameId<'agents'>;
export type OperationId = GameId<'operations'>;

// Example of how these might be used if needed for schema validation (not for here)
// export const conversationId: ConversationId = '' as ConversationId;
// export const playerId: PlayerId = '' as PlayerId;
// export const agentId: AgentId = '' as AgentId;
// export const operationId: OperationId = '' as OperationId;

// Added a helper for worldMapId as it's used in worldMap.ts
export type WorldMapId = string; // Assuming it's not a GameId, or define as needed
// Based on convex/aiTown/worldMap.ts, it's just v.id('maps'), so a simple string.

// Based on convex/aiTown/agentDescription.ts and playerDescription.ts
export type PlayerDescriptionId = string; // v.id('playerDescriptions')
export type AgentDescriptionId = string; // v.id('agentDescriptions')

// Based on convex/aiTown/world.ts
export type WorldId = string; // v.id('worlds')
export type EngineId = string; // v.id('engines')

// Added for completeness from other potential ID types in Convex schema
export type MemoryId = string; // v.id('memories')
export type EmbeddingId = string; // v.id('memoryEmbeddings')
export type InputId = string; // v.id('inputs')
export type MapId = string; // v.id('maps') used by World for its mapId property
// We already have WorldMapId, MapId can be an alias or specific if different. Let's use MapId.

// LocationId from location.ts
export type LocationId = string & { __type: 'locations' }; // Simplified branding

export function parseLocationId(id: string): LocationId {
    // Basic validation, can be expanded if needed
    if (typeof id !== 'string' || id.length === 0) {
        throw new Error(`Invalid LocationId: ${id}`);
    }
    return id as LocationId;
}

// MovementId from movement.ts
export type MovementId = string & { __type: 'movements' };
export function parseMovementId(id: string): MovementId {
    if (typeof id !== 'string' || id.length === 0) {
        throw new Error(`Invalid MovementId: ${id}`);
    }
    return id as MovementId;
}

// Helper function to create a new number for an ID, assuming we might need it client-side
// For client-side generation, ensure this doesn't clash with server IDs if data syncs.
// This is more for local, non-persistent entities or testing.
let nextClientSideIdNumber = 0;
export function allocClientOnlyGameId<T extends IdTypes>(idType: T): GameId<T> {
  const type = IdShortCodes[idType];
  if (!type) {
    throw new Error(`Invalid game ID type: ${idType}`);
  }
  const num = nextClientSideIdNumber++;
  return `${type}c:${num}` as GameId<T>; // 'c' for client-side
}

// Helper to check if an ID is a client-only ID
export function isClientOnlyId(gameId: string): boolean {
  return gameId.includes('c:');
}

// For historicalObject.ts
export type HistoricalObjectId = string;
export function parseHistoricalObjectId(id: string): HistoricalObjectId {
    if (typeof id !== 'string' || id.length === 0) {
        throw new Error(`Invalid HistoricalObjectId: ${id}`);
    }
    return id as HistoricalObjectId;
}
