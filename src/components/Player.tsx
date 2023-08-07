import { useTick } from '@pixi/react';
import { useRef, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { getPoseFromMotion } from '../../convex/lib/physics';
import { Doc } from '../../convex/_generated/dataModel';
import { Player as PlayerState, Pose } from '../../convex/types';
import { Character } from './Character';

const SpeechDurationMs = 3000;

export type SelectPlayer = (playerState: PlayerState) => void;

export const Player = ({
  player,
  offset,
  tileDim,
  onClick,
}: {
  player: Doc<'players'>;
  offset: number;
  tileDim: number;
  onClick: SelectPlayer;
}) => {
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
      x={pose.position.x * tileDim + tileDim / 2}
      y={pose.position.y * tileDim + tileDim / 2}
      orientation={pose.orientation}
      isMoving={
        playerState.motion.type === 'walking' && playerState.motion.targetEndTs >= time.current
      }
      isThinking={playerState.thinking}
      isSpeaking={
        playerState.lastChat?.message.type === 'responded' &&
        (playerState.lastChat.message.ts ?? 0) > time.current - SpeechDurationMs
      }
      textureUrl={character.textureUrl}
      spritesheetData={character.spritesheetData}
      speed={character.speed}
      onClick={() => {
        onClick(playerState);
      }}
    />
  );
};
