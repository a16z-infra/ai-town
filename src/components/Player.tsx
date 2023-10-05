import { Doc, Id } from '../../convex/_generated/dataModel';
import { Character } from './Character.tsx';
import { orientationDegrees } from '../../convex/util/geometry.ts';
import { characters } from '../../data/characters.ts';
import { toast } from 'react-toastify';
import { useHistoricalValue } from '../hooks/useHistoricalValue.ts';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { PlayerMetadata } from '../../convex/world.ts';
import { DebugPath } from './DebugPath.tsx';

export type SelectElement = (element?: { kind: 'player'; id: Id<'players'> }) => void;

const logged = new Set<string>();

export const Player = ({
  isViewer,
  player,
  onClick,
  historicalTime,
}: {
  isViewer: boolean;
  player: PlayerMetadata;
  onClick: SelectElement;
  historicalTime?: number;
}) => {
  const world = useQuery(api.world.defaultWorld);
  const character = characters.find((c) => c.name === player.character);
  const location = useHistoricalValue<'locations'>(historicalTime, player.location);
  if (!character) {
    if (!logged.has(player.character)) {
      logged.add(player.character);
      toast.error(`Unknown character ${player.character}`);
    }
    return;
  }
  if (!world) {
    return;
  }
  if (!location) {
    return;
  }
  const tileDim = world.map.tileDim;
  return (
    <>
      <Character
        x={location.x * tileDim + tileDim / 2}
        y={location.y * tileDim + tileDim / 2}
        orientation={orientationDegrees({ dx: location.dx, dy: location.dy })}
        isMoving={location.velocity > 0}
        isThinking={player.isThinking}
        isSpeaking={player.isSpeaking}
        isViewer={isViewer}
        textureUrl={character.textureUrl}
        spritesheetData={character.spritesheetData}
        speed={character.speed}
        onClick={() => {
          onClick({ kind: 'player', id: player._id });
        }}
      />
    </>
  );
};
