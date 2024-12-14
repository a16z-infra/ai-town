import { GameId, parseGameId } from '../../convex/aiTown/ids';
import { AgentDescription } from '../../convex/aiTown/agentDescription';
import { PlayerDescription } from '../../convex/aiTown/playerDescription';
import { World } from '../../convex/aiTown/world';
import { WorldMap } from '../../convex/aiTown/worldMap';
import { Id } from '../../convex/_generated/dataModel';
import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { parseMap } from '../../convex/util/object';
import { CharacterConfig } from '../../convex/aiTown/getCharacterConfig';

export type ServerGame = {
  world: World;
  playerDescriptions: Map<GameId<'players'>, PlayerDescription>;
  agentDescriptions: Map<GameId<'agents'>, AgentDescription>;
  worldMap: WorldMap;
  characterConfigs?: Map<string, CharacterConfig>;
  descriptionsModified?: boolean;
  worldId?: Id<'worlds'>;
};

// TODO: This hook reparses the game state (even if we're not rerunning the query)
// when used in multiple components. Move this to a context to only parse it once.
export function useServerGame(worldId: Id<'worlds'> | undefined): ServerGame | undefined {
  const worldState = useQuery(api.world.worldState, worldId ? { worldId } : 'skip');
  const descriptions = useQuery(api.world.gameDescriptions, worldId ? { worldId } : 'skip');

  const game = useMemo(() => {
    if (!worldState || !descriptions) {
      console.log('Waiting for game state:', {
        hasWorldState: !!worldState,
        hasDescriptions: !!descriptions,
        worldId,
      });
      return undefined;
    }

    console.log('Initializing server game:', {
      hasCharacterConfigs: !!descriptions.characterConfigs,
      numCharacterConfigs: descriptions.characterConfigs?.length ?? 0,
      availableConfigs: descriptions.characterConfigs?.map((c) => c.id) ?? [],
      numPlayers: worldState.world.players.length,
      playerIds: worldState.world.players.map((p) => p.id),
      numPlayerDescriptions: descriptions.playerDescriptions.length,
      playerDescriptionIds: descriptions.playerDescriptions.map((p) => p.playerId),
    });

    const game = {
      world: new World(worldState.world),
      agentDescriptions: parseMap(
        descriptions.agentDescriptions,
        AgentDescription,
        (p) => p.agentId,
      ),
      playerDescriptions: new Map(
        descriptions.playerDescriptions.map((desc) => [
          parseGameId('players', desc.playerId),
          new PlayerDescription({
            playerId: desc.playerId,
            character: desc.character,
            description: desc.description,
            name: desc.name,
            textureUrl: desc.textureUrl,
          }),
        ]),
      ),
      worldMap: new WorldMap(descriptions.worldMap),
      characterConfigs: new Map(
        descriptions.characterConfigs?.map(({ id, config }) => [id, config]) ?? [],
      ),
      descriptionsModified: false,
      worldId,
    };

    console.log('Game state initialized:', {
      numPlayers: game.world.players.size,
      playerIds: Array.from(game.world.players.keys()),
      numPlayerDescriptions: game.playerDescriptions.size,
      playerDescriptionIds: Array.from(game.playerDescriptions.keys()),
      numCharacterConfigs: game.characterConfigs?.size ?? 0,
      characterConfigIds: Array.from(game.characterConfigs?.keys() ?? []),
    });

    return game;
  }, [worldState, descriptions]);

  return game;
}
