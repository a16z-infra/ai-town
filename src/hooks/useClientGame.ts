import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

// Import data model classes and serialized types
import { World, SerializedWorld } from '../dataModels/world';
import { PlayerDescription, SerializedPlayerDescription } from '../dataModels/playerDescription';
import { AgentDescription, SerializedAgentDescription } from '../dataModels/agentDescription';
import { WorldMap, SerializedWorldMap } from '../dataModels/worldMap';
import type { PlayerId, AgentId } from '../dataModels/ids';

// Define the structure of the game state object returned by the hook
export interface ClientGame {
  world: World;
  playerDescriptions: Map<PlayerId, PlayerDescription>;
  agentDescriptions: Map<AgentId, AgentDescription>;
  worldMap: WorldMap;
  // Add specific top-level properties from the simple worldDoc for convenience
  worldId: string;
  worldName: string;
  mapId: string;
  engineId: string;
}

export function useClientGame(worldId?: string): ClientGame | undefined {
  // Fetch basic world document
  const worldDoc = useLiveQuery(
    () => (worldId ? db.worlds.where({ worldId }).first() : undefined),
    [worldId],
  );

  // Fetch map for the world
  const mapDoc = useLiveQuery(
    () => (worldDoc?.mapId ? db.maps.where({ mapId: worldDoc.mapId }).first() : undefined),
    [worldDoc?.mapId],
  );

  // Fetch all player descriptions for the world
  const playerDescriptionsArr = useLiveQuery(
    () => (worldId ? db.playerDescriptions.where({ worldId }).toArray() : []),
    [worldId],
    [], // Initial value
  );

  // Fetch all agent descriptions for the world
  const agentDescriptionsArr = useLiveQuery(
    () => (worldId ? db.agentDescriptions.where({ worldId }).toArray() : []),
    [worldId],
    [], // Initial value
  );
  
  // Fetch all players, agents, and conversations for the world
  // These are needed to construct the `SerializedWorld` for the `World` class instance
  const playersArr = useLiveQuery(
    () => (worldId ? db.players.where({ worldId }).toArray() : []),
    [worldId],
    [],
  );

  const agentsArr = useLiveQuery(
    () => (worldId ? db.agents.where({ worldId }).toArray() : []),
    [worldId],
    [],
  );

  const conversationsArr = useLiveQuery(
    () => (worldId ? db.conversations.where({ worldId }).toArray() : []),
    [worldId],
    [],
  );

  return useMemo(() => {
    if (
      !worldDoc ||
      !mapDoc ||
      !playerDescriptionsArr || // Already defaults to []
      !agentDescriptionsArr ||   // Already defaults to []
      !playersArr ||             // Already defaults to []
      !agentsArr ||              // Already defaults to []
      !conversationsArr          // Already defaults to []
    ) {
      // console.log("useClientGame: Waiting for data...", { worldDoc, mapDoc, playerDescriptionsArr, agentDescriptionsArr, playersArr, agentsArr, conversationsArr });
      return undefined;
    }

    // console.log("useClientGame: All data fetched, processing...", { worldDoc, mapDoc, playerDescriptionsArr, agentDescriptionsArr, playersArr, agentsArr, conversationsArr });

    try {
      // Construct SerializedWorld for the World class
      // The `id` field for players, agents, conversations in Dexie tables is just for Dexie's auto-increment.
      // The actual `playerId`, `agentId`, `conversationId` are the string IDs we use.
      // The SerializedPlayer, etc. types from dataModels expect these string IDs.
      // The tables store objects that should match these Serialized types.
      const serializedWorldData: SerializedWorld = {
        nextId: (worldDoc as any).nextId || 0, // Assuming nextId might be on worldDoc or default
        // Ensure the arrays from Dexie match SerializedConversation[], SerializedPlayer[], SerializedAgent[]
        // Type casting needed if Dexie's Table<T> doesn't perfectly align with SerializedT
        conversations: conversationsArr as any[],
        players: playersArr as any[],
        agents: agentsArr as any[],
        // historicalLocations: undefined, // Or fetch if stored separately
      };
      const worldInstance = new World(serializedWorldData);

      const playerDescriptionsMap = new Map(
        playerDescriptionsArr.map((pd) => [
          pd.playerId as PlayerId, 
          new PlayerDescription(pd as any as SerializedPlayerDescription)
        ])
      );

      const agentDescriptionsMap = new Map(
        agentDescriptionsArr.map((ad) => [
          ad.agentId as AgentId, 
          new AgentDescription(ad as any as SerializedAgentDescription)
        ])
      );
      
      // The WorldMap constructor now expects data matching MapData (from db.ts)
      // due to changes in src/dataModels/worldMap.ts to use number[][] for tile layers.
      // So, mapDoc can be directly cast to SerializedWorldMap if their structures align.
      // SerializedWorldMap in worldMap.ts expects: width, height, tileSetUrl, tileSetDimX, tileSetDimY, tileDim, bgTiles (number[][]), objectTiles (number[][]), animatedSprites
      // MapData in db.ts provides all of these.
      const worldMapInstance = new WorldMap(mapDoc as any as SerializedWorldMap);

      return {
        world: worldInstance,
        playerDescriptions: playerDescriptionsMap,
        agentDescriptions: agentDescriptionsMap,
        worldMap: worldMapInstance,
        // Add top-level world properties
        worldId: worldDoc.worldId,
        worldName: worldDoc.name,
        mapId: worldDoc.mapId,
        engineId: worldDoc.engineId,
      };
    } catch (e) {
      console.error("Error creating game state in useClientGame:", e);
      return undefined;
    }
  }, [worldDoc, mapDoc, playerDescriptionsArr, agentDescriptionsArr, playersArr, agentsArr, conversationsArr]);
}
