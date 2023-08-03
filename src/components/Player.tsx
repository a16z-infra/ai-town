import { useTick } from '@pixi/react';
import { useRef, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { getPoseFromMotion } from '../../convex/lib/physics';
import { Doc } from '../../convex/_generated/dataModel';
import { Pose } from '../../convex/types';
import { Character } from './Character';

const SpeechDurationMs = 3000;

export const Player = ({ player, offset }: { player: Doc<'players'>; offset: number }) => {
  const playerState = useQuery(api.players.playerState, {
    playerId: player._id,
  });
  const character = useQuery(api.players.characterData, {
    characterId: player.characterId,
  });
  const [pose, setPose] = useState<Pose>();
  const time = useRef(0);
  useTick(() => {
    time.current = Date.now() + offset;
    if (!playerState) return;
    if (!time.current) return;
    const pose = getPoseFromMotion(playerState.motion, time.current);
    setPose(pose);
  });
  if (!playerState || !character) return null;
  if (!pose) return null;
  return (
    <Character
      pose={pose}
      isMoving={playerState.motion.type === 'walking'}
      isThinking={playerState.thinking}
      isSpeaking={(playerState.lastSpokeTs ?? 0) > time.current - SpeechDurationMs}
      textureUrl={character.textureUrl}
      spritesheetData={character.spritesheetData}
    />
  );
};
