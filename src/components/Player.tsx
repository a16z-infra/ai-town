import { Character } from './Character.tsx';
import { orientationDegrees } from '../../convex/util/geometry.ts';
import { characters } from '../../data/characters.ts';
import { toast } from 'react-toastify';
import { Player as PlayerType } from '../../convex/aiTown/player.ts';
import { GameId } from '../../convex/aiTown/ids.ts';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { Location, locationFields, playerLocation } from '../../convex/aiTown/location.ts';
import { useHistoricalValue } from '../hooks/useHistoricalValue.ts';

export type SelectElement = (element?: { kind: 'player'; id: GameId<'players'> }) => void;

const logged = new Set<string>();

export const Player = ({
  worldId,
  isViewer,
  player,
  onClick,
  historicalTime,
}: {
  worldId: Id<'worlds'>;
  isViewer: boolean;
  player: PlayerType;
  onClick: SelectElement;
  historicalTime?: number;
}) => {
  const gameState = useQuery(api.world.gameState, { worldId });
  const descriptions = useQuery(api.world.gameDescriptions, { worldId });

  if (!gameState || !descriptions) {
    return null;
  }
  const { world } = gameState;

  const { playerDescriptions, map } = descriptions;
  const playerCharacter = playerDescriptions.find((p) => p.playerId === player.id)?.character!;
  const character = characters.find((c) => c.name === playerCharacter);

  const locationBuffer = world.historicalLocations && world.historicalLocations[player.id];
  const historicalLocation = useHistoricalValue<Location>(
    locationFields,
    historicalTime,
    playerLocation(player),
    locationBuffer,
  );
  if (!character) {
    if (!logged.has(playerCharacter)) {
      logged.add(playerCharacter);
      toast.error(`Unknown character ${playerCharacter}`);
    }
    return null;
  }

  if (!historicalLocation) {
    return null;
  }

  const isSpeaking = !!world.conversations.find((c) => c.isTyping?.playerId === player.id);
  const isThinking =
    !isSpeaking && !!world.agents.find((a) => a.playerId === player.id && !!a.inProgressOperation);
  const tileDim = map.tileDim;
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
};
