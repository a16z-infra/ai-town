import { Character } from './Character.tsx';
import { orientationDegrees } from '../../convex/util/geometry.ts';
import { characters } from '../../data/characters.ts';
import { toast } from 'react-toastify';
import { Player as ServerPlayer } from '../../convex/aiTown/player.ts';
import { GameId } from '../../convex/aiTown/ids.ts';
import { Id } from '../../convex/_generated/dataModel';
import { Location, locationFields, playerLocation } from '../../convex/aiTown/location.ts';
import { useHistoricalValue } from '../hooks/useHistoricalValue.ts';
import { PlayerDescription } from '../../convex/aiTown/playerDescription.ts';
import { WorldMap } from '../../convex/aiTown/worldMap.ts';
import { ServerGame } from '../hooks/serverGame.ts';
import { getCharacterConfig } from '../../convex/aiTown/getCharacterConfig.ts';

export type SelectElement = (element?: { kind: 'player'; id: GameId<'players'> }) => void;

const logged = new Set<string>();

export const Player = ({
  game,
  isViewer,
  player,
  onClick,
  historicalTime,
}: {
  game: ServerGame;
  isViewer: boolean;
  player: ServerPlayer;
  onClick: SelectElement;
  historicalTime?: number;
}) => {
  try {
    // Check if game state is ready
    if (!game.world || !game.playerDescriptions || !game.worldMap) {
      console.log('Game state not ready:', {
        hasWorld: !!game.world,
        hasPlayerDescriptions: !!game.playerDescriptions,
        hasWorldMap: !!game.worldMap,
      });
      return null;
    }

    const playerDesc = game.playerDescriptions.get(player.id);
    if (!playerDesc) {
      console.log('No player description:', {
        playerId: player.id,
        availableDescriptions: Array.from(game.playerDescriptions.entries()).map(([id, desc]) => ({
          id,
          character: desc.character,
          name: desc.name,
        })),
        allPlayers: Array.from(game.world.players.entries()).map(([id, p]) => ({
          id,
          human: p.human,
        })),
      });
      return null;
    }

    const playerCharacter = playerDesc.character;
    if (!playerCharacter) {
      console.log('No character assigned to player:', {
        playerId: player.id,
        playerDesc,
      });
      return null;
    }

    const character = getCharacterConfig(game, playerCharacter);
    if (!character) {
      if (!logged.has(playerCharacter)) {
        logged.add(playerCharacter);
        console.log('Waiting for character config to load:', {
          characterId: playerCharacter,
          hasConfigs: !!game.characterConfigs,
          numConfigs: game.characterConfigs?.size ?? 0,
          availableConfigs: Array.from(game.characterConfigs?.keys() ?? []),
          playerDescriptions: Array.from(game.playerDescriptions.entries()).map(([id, desc]) => ({
            id,
            character: desc.character,
          })),
        });
      }
      return null;
    }

    const locationBuffer = game.world.historicalLocations?.get(player.id);
    const historicalLocation = useHistoricalValue<Location>(
      locationFields,
      historicalTime,
      playerLocation(player),
      locationBuffer,
    );

    if (!historicalLocation) {
      console.log('No historical location:', {
        playerId: player.id,
        hasLocationBuffer: !!locationBuffer,
      });
      return null;
    }

    const isSpeaking = !![...game.world.conversations.values()].find(
      (c) => c.isTyping?.playerId === player.id,
    );
    const isThinking =
      !isSpeaking &&
      !![...game.world.agents.values()].find(
        (a) => a.playerId === player.id && !!a.inProgressOperation,
      );
    const tileDim = game.worldMap.tileDim;
    const historicalFacing = { dx: historicalLocation.dx, dy: historicalLocation.dy };

    return (
      <>
        <Character
          x={historicalLocation.x * tileDim + tileDim / 2}
          y={historicalLocation.y * tileDim + tileDim / 2}
          orientation={orientationDegrees(historicalFacing)}
          isMoving={historicalLocation.speed > 0}
          isThinking={isThinking}
          isSpeaking={isSpeaking}
          emoji={
            player.activity && player.activity.until > (historicalTime ?? Date.now())
              ? player.activity?.emoji
              : undefined
          }
          isViewer={isViewer}
          textureUrl={character.textureUrl}
          spritesheetData={character.spritesheetData}
          speed={character.speed}
          onClick={() => {
            onClick({ kind: 'player', id: player.id });
          }}
        />
      </>
    );
  } catch (error) {
    console.error('Error rendering player:', {
      error,
      playerId: player.id,
      hasGame: !!game,
      hasWorld: !!game?.world,
      hasPlayerDescriptions: !!game?.playerDescriptions,
    });
    return null;
  }
};
