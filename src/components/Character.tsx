import { BaseTexture, ISpritesheetData, Spritesheet } from 'pixi.js';
import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatedSprite, Container, Graphics, Text } from '@pixi/react';
import * as PIXI from 'pixi.js';

export const Character = ({
  textureUrl,
  spritesheetData,
  x,
  y,
  orientation,
  isMoving = false,
  isThinking = false,
  isSpeaking = false,
  emoji = '',
  isViewer = false,
  speed = 0.1,
  onClick,
  name,
  needs,
}: {
  textureUrl: string;
  spritesheetData: ISpritesheetData;
  x: number;
  y: number;
  orientation: number;
  isMoving?: boolean;
  isThinking?: boolean;
  isSpeaking?: boolean;
  emoji?: string;
  isViewer?: boolean;
  speed?: number;
  onClick: () => void;
  name?: string;
  needs?: { hunger: number; energy: number; security: number; social: number; esteem: number; fulfillment: number };
}) => {
  const [spriteSheet, setSpriteSheet] = useState<Spritesheet>();
  useEffect(() => {
    const parseSheet = async () => {
      const sheet = new Spritesheet(
        BaseTexture.from(textureUrl, {
          scaleMode: PIXI.SCALE_MODES.NEAREST,
        }),
        spritesheetData,
      );
      await sheet.parse();
      setSpriteSheet(sheet);
    };
    void parseSheet();
  }, []);

  const roundedOrientation = Math.floor(orientation / 90);
  const direction = ['right', 'down', 'left', 'up'][roundedOrientation];

  const ref = useRef<PIXI.AnimatedSprite | null>(null);
  useEffect(() => {
    if (isMoving) {
      ref.current?.play();
    }
  }, [direction, isMoving]);

  if (!spriteSheet) return null;

  let blockOffset = { x: 0, y: 0 };
  switch (roundedOrientation) {
    case 2: blockOffset = { x: -20, y: 0 }; break;
    case 0: blockOffset = { x: 20, y: 0 }; break;
    case 3: blockOffset = { x: 0, y: -20 }; break;
    case 1: blockOffset = { x: 0, y: 20 }; break;
  }

  return (
    <Container x={x} y={y} interactive={true} pointerdown={onClick} cursor="pointer">
      {isThinking && (
        <Text x={-20} y={-10} scale={{ x: -0.8, y: 0.8 }} text={'💭'} anchor={{ x: 0.5, y: 0.5 }} />
      )}
      {isSpeaking && (
        <Text x={18} y={-10} scale={0.8} text={'💬'} anchor={{ x: 0.5, y: 0.5 }} />
      )}
      {isViewer && <ViewerIndicator />}
      <AnimatedSprite
        ref={ref}
        isPlaying={isMoving}
        textures={spriteSheet.animations[direction]}
        animationSpeed={speed}
        anchor={{ x: 0.5, y: 0.5 }}
      />
      {emoji && (
        <Text x={0} y={-24} scale={{ x: -0.8, y: 0.8 }} text={emoji} anchor={{ x: 0.5, y: 0.5 }} />
      )}
      {/* Agent name — pixel-style, subtle */}
      {name && !isViewer && (
        <Text
          x={0} y={14}
          text={name.split(' ')[0]}
          anchor={{ x: 0.5, y: 0 }}
          style={new PIXI.TextStyle({
            fontSize: 7,
            fill: 0xe4a672,
            stroke: 0x181425,
            strokeThickness: 2,
            fontFamily: 'Upheaval Pro, monospace',
            letterSpacing: 0.5,
          })}
        />
      )}
      {/* Needs indicator — 3 small dots showing top 3 critical needs */}
      {needs && !isViewer && <NeedsDots needs={needs} />}
    </Container>
  );
};

// 3 small colored dots showing the state of key needs
// Colors fade from bright (critical) to dim (fine)
function NeedsDots({ needs }: { needs: { hunger: number; energy: number; security: number; social: number; esteem: number; fulfillment: number } }) {
  const entries = [
    { val: needs.hunger, color: 0x6abe30 },    // green for food
    { val: needs.energy, color: 0x639bff },     // blue for energy
    { val: needs.social, color: 0xd77bba },     // pink for social
  ];

  const draw = useCallback((g: PIXI.Graphics) => {
    g.clear();
    entries.forEach((e, i) => {
      const alpha = e.val > 50 ? 0.3 : e.val > 30 ? 0.7 : 1.0;
      const dotColor = e.val > 50 ? e.color : e.val > 30 ? 0xfbf236 : 0xac3232;
      g.beginFill(dotColor, alpha);
      g.drawCircle(-4 + i * 4, 0, 1.5);
      g.endFill();
    });
  }, [needs.hunger, needs.energy, needs.social]);

  return <Graphics y={-32} draw={draw} />;
}

function ViewerIndicator() {
  const draw = useCallback((g: PIXI.Graphics) => {
    g.clear();
    g.beginFill(0xffff0b, 0.5);
    g.drawRoundedRect(-10, 10, 20, 10, 100);
    g.endFill();
  }, []);

  return <Graphics draw={draw} />;
}
