import { BaseTexture, ISpritesheetData, Spritesheet } from 'pixi.js';
import { useState, useEffect } from 'react';
import { Pose } from '../../convex/types';
import { AnimatedSprite, Container, Text } from '@pixi/react';

export const Character = ({
  texturePath,
  spritesheetData,
  pose,
  isMoving = false,
  isThinking = false,
  isSpeaking = false,
  speed = 0.1,
}: {
  // Path to the texture packed image.
  texturePath: string;
  // The data for the spritesheet.
  spritesheetData: ISpritesheetData;
  // The pose of the NPC.
  pose: Pose;
  isMoving?: boolean;
  // Shows a thought bubble if true.
  isThinking?: boolean;
  // Shows a speech bubble if true.
  isSpeaking?: boolean;
  // The speed of the animation. Can be tuned depending on the side and speed of the NPC.
  speed?: number;
}) => {
  const [spriteSheet, setSpriteSheet] = useState<Spritesheet>();
  useEffect(() => {
    const parseSheet = async () => {
      const sheet = new Spritesheet(BaseTexture.from(texturePath), spritesheetData);
      await sheet.parse();
      setSpriteSheet(sheet);
    };
    void parseSheet();
  }, []);

  if (!spriteSheet) return null;

  // The first "left" is "right" but reflected.
  const roundedOrientation = Math.round(pose.orientation / 90);
  const direction = ['left', 'up', 'left', 'down'][roundedOrientation];

  const { x, y } = pose.position;
  return (
    <Container x={x} y={y}>
      {isThinking && (
        // TODO: We'll eventually have separate assets for thinking and speech animations.
        <Text x={-10} y={-10} scale={{ x: -0.5, y: 0.5 }} text={'💭'} anchor={{ x: 0.5, y: 0.5 }} />
      )}
      {isSpeaking && (
        // TODO: We'll eventually have separate assets for thinking and speech animations.
        <Text x={15} y={-5} scale={0.5} text={'💬'} anchor={{ x: 0.5, y: 0.5 }} />
      )}
      <AnimatedSprite
        isPlaying={isMoving}
        textures={spriteSheet.animations[direction]}
        animationSpeed={speed}
        // If the orientation is 90 (facing right), we need to flip the sprite.
        scale={roundedOrientation === 0 ? { x: -1, y: 1 } : { x: 1, y: 1 }}
        anchor={{ x: 0.5, y: 0.5 }}
      />
    </Container>
  );
};
