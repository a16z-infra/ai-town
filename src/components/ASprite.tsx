import { BaseTexture, ISpritesheetData, Spritesheet } from 'pixi.js';
import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatedSprite, Container, Graphics, Text } from '@pixi/react';
import * as PIXI from 'pixi.js';

export const ASprite = ({
  spritesheetURL,
  spritesheetData,
  x,
  y,
  speed = 0.1,
  onClick,
}: {
  // The URL for the spritesheet.
  spritesheetURL: string;
  // The data for the spritesheet.
  spritesheetData: string;
  // The pose of the NPC.
  x: number;
  y: number;
  // The speed of the animation. Can be tuned depending on the side and speed of the NPC.
  speed?: number;
  onClick: () => void;
}) => {
  const [spriteSheet, setSpriteSheet] = useState<Spritesheet>();
  useEffect(() => {
    const parseSheet = async () => {
      let sheet = await PIXI.Assets.load(spritesheetURL);
      //let sheet = await PIXI.Assets.load("./assets/fountain.json");
      setSpriteSheet(sheet);
    };
    void parseSheet();
  }, []);


  if (!spriteSheet) return null;

  return (
    <Container x={x} y={y} interactive={true} pointerdown={onClick} cursor="pointer">
      <AnimatedSprite
        isPlaying={true}
        textures={spriteSheet.animations['row0']}
        animationSpeed={speed}
        anchor={{ x: 0.5, y: 0.5 }}
      />
    </Container>
  );
};

function ViewerIndicator() {
  const draw = useCallback((g: PIXI.Graphics) => {
    g.clear();
    g.beginFill(0xffff0b, 0.5);
    g.drawRoundedRect(-10, 10, 20, 10, 100);
    g.endFill();
  }, []);

  return <Graphics draw={draw} />;
}
