import { Doc, Id } from '../../convex/_generated/dataModel';
import { Character } from './Character.tsx';
import { orientationDegrees } from '../../convex/util/geometry.ts';
import { characters } from '../../data/characters.ts';
import { toast } from 'react-toastify';
import { useHistoricalValue } from '../hooks/useHistoricalValue.ts';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { PlayerMetadata } from '../../convex/world.ts';

export type SelectElement = (element?: { kind: 'player'; id: Id<'players'> }) => void;

const logged = new Set<string>();

export const Player = ({
  isViewer,
  player,
  location,
  onClick,
  historicalTime,
}: {
  isViewer: boolean;
  player: PlayerMetadata;
  location: Doc<'locations'>;
  onClick: SelectElement;
  historicalTime?: number;
}) => {
  const world = useQuery(api.world.defaultWorld);
  const character = characters.find((c) => c.name === player.character);
  const historicalLocation = useHistoricalValue<'locations'>(historicalTime, location);
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
  if (!historicalLocation) {
    return;
  }
  const tileDim = world.map.tileDim;
  return (
    <>
      <Character
        x={historicalLocation.x * tileDim + tileDim / 2}
        y={historicalLocation.y * tileDim + tileDim / 2}
        orientation={orientationDegrees({ dx: historicalLocation.dx, dy: historicalLocation.dy })}
        isMoving={historicalLocation.velocity > 0}
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
