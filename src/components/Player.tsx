import { Character } from './Character.tsx';
import { orientationDegrees } from '../../convex/util/geometry.ts';
import { characters } from '../../data/characters.ts';
import { toast } from 'react-toastify';
import { Player as PlayerType } from '../../convex/aiTown/player.ts';
import { GameId } from '../../convex/aiTown/ids.ts';
import { World, WorldMap } from '../../convex/aiTown/world.ts';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

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
  // const historicalLocation = useHistoricalValue<'locations'>(
  //   locationFields,
  //   historicalTime,
  //   location?.doc,
  //   location?.history,
  // );
  if (!character) {
    if (!logged.has(playerCharacter)) {
      logged.add(playerCharacter);
      toast.error(`Unknown character ${playerCharacter}`);
    }
    return null;
  }

  // if (!historicalLocation) {
  //   return null;
  // }

  const isSpeaking = !!world.conversations.find((c) => c.isTyping?.playerId === player.id);
  const isThinking =
    !isSpeaking && !!world.agents.find((a) => a.playerId === player.id && !!a.inProgressOperation);
  const tileDim = map.tileDim;
  return (
    <>
      <Character
        x={player.position.x * tileDim + tileDim / 2}
        y={player.position.y * tileDim + tileDim / 2}
        orientation={orientationDegrees(player.facing)}
        isMoving={player.speed > 0}
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
