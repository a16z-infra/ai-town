// Removed Convex imports
import { Conversation, SerializedConversation } from './conversation';
import { Player, SerializedPlayer } from './player';
import { Agent, SerializedAgent } from './agent';
import { GameId, parseGameId, PlayerId as PlayerIdType } from './ids';
import { parseMap, serializeMap } from './objectUtils'; // Ensure this path is correct

// Interface for historical location data
export interface SerializedHistoricalLocation {
  playerId: PlayerIdType; // Expecting pre-formatted string like "p:1"
  location: ArrayBuffer; // Was v.bytes()
}

// Interface for the complete serialized world state
export interface SerializedWorld {
  // worldId: string; // Added: The ID of this world, for context
  // name: string; // Added: The name of this world
  // mapId: string; // Added: The mapId associated with this world
  // engineId: string; // Added: The engineId associated with this world
  // lastViewed?: number; // Added

  // nextId represents a counter for allocating new GameIds locally if needed.
  // This might be managed differently on the client (e.g., using a global counter or UUIDs).
  // For now, keeping it as part of the structure for compatibility with existing constructor.
  nextId: number; 
  
  conversations: SerializedConversation[];
  players: SerializedPlayer[];
  agents: SerializedAgent[];
  historicalLocations?: SerializedHistoricalLocation[];
}

export class World {
  // These fields are from the simple db.ts World interface, added for context.
  // They are not part of the original convex/aiTown/World class but useful for ClientGame.
  // worldId: string;
  // name: string;
  // mapId: string;
  // engineId: string;
  // lastViewed?: number;

  nextId: number;
  conversations: Map<GameId<'conversations'>, Conversation>;
  players: Map<GameId<'players'>, Player>;
  agents: Map<GameId<'agents'>, Agent>;
  historicalLocations?: Map<GameId<'players'>, ArrayBuffer>;

  constructor(serialized: SerializedWorld) {
    // Initialize added fields
    // this.worldId = serialized.worldId;
    // this.name = serialized.name;
    // this.mapId = serialized.mapId;
    // this.engineId = serialized.engineId;
    // this.lastViewed = serialized.lastViewed;

    const { nextId, historicalLocations } = serialized;

    this.nextId = nextId;
    this.conversations = parseMap(serialized.conversations, Conversation, (c) => c.id);
    this.players = parseMap(serialized.players, Player, (p) => p.id);
    this.agents = parseMap(serialized.agents, Agent, (a) => a.id);

    if (historicalLocations) {
      this.historicalLocations = new Map();
      for (const { playerId, location } of historicalLocations) {
        // Ensure playerId is parsed if it's a raw string from storage
        this.historicalLocations.set(parseGameId('players', playerId as string), location);
      }
    }
  }

  playerConversation(player: Player): Conversation | undefined {
    // Ensure player.id is correctly typed for Map lookup if necessary
    return [...this.conversations.values()].find((c) => c.participants.has(player.id));
  }

  serialize(): SerializedWorld {
    return {
      // worldId: this.worldId,
      // name: this.name,
      // mapId: this.mapId,
      // engineId: this.engineId,
      // lastViewed: this.lastViewed,
      nextId: this.nextId,
      conversations: serializeMap(this.conversations).map((c) => c.serialize()),
      players: serializeMap(this.players).map((p) => p.serialize()),
      agents: serializeMap(this.agents).map((a) => a.serialize()),
      historicalLocations:
        this.historicalLocations &&
        serializeMap(this.historicalLocations).map(([playerId, location]) => ({ // serializeMap returns [K,V][] for Maps
          playerId: playerId as PlayerIdType, // Assuming key is already PlayerIdType
          location,
        })),
    };
  }
}
