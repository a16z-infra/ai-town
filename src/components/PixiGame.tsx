import * as PIXI from 'pixi.js';
import { useApp } from '@pixi/react';
import { Player, SelectElement } from './Player.tsx';
import { useEffect, useRef, useState } from 'react';
import { PixiStaticMap } from './PixiStaticMap.tsx';
import PixiViewport from './PixiViewport.tsx';
import { Viewport } from 'pixi-viewport';
import { Id } from '../../convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api.js';
import { useSendInput } from '../hooks/sendInput.ts';
import { toastOnError } from '../toasts.ts';
import { DebugPath } from './DebugPath.tsx';
import { PositionIndicator } from './PositionIndicator.tsx';
import { SHOW_DEBUG_UI } from './Game.tsx';
import { ServerGame } from '../hooks/serverGame.ts';

export const PixiGame = (props: {
  worldId: Id<'worlds'>;
  engineId: Id<'engines'>;
  game: ServerGame;
  historicalTime: number | undefined;
  width: number;
  height: number;
  setSelectedElement: SelectElement;
}) => {
  // PIXI setup.
  const pixiApp = useApp();
  const viewportRef = useRef<Viewport | undefined>();

  const humanTokenIdentifier = useQuery(api.world.userStatus, { worldId: props.worldId }) ?? null;
  const humanPlayerId = [...props.game.world.players.values()].find(
    (p) => p.human === humanTokenIdentifier,
  )?.id;

  const moveTo = useSendInput(props.engineId, 'moveTo');

  // Interaction for clicking on the world to navigate.
  const dragStart = useRef<{ screenX: number; screenY: number } | null>(null);
  const onMapPointerDown = (e: any) => {
    // https://pixijs.download/dev/docs/PIXI.FederatedPointerEvent.html
    dragStart.current = { screenX: e.screenX, screenY: e.screenY };
  };

  const [lastDestination, setLastDestination] = useState<{
    x: number;
    y: number;
    t: number;
  } | null>(null);
  const onMapPointerUp = async (e: any) => {
    if (dragStart.current) {
      const { screenX, screenY } = dragStart.current;
      dragStart.current = null;
      const [dx, dy] = [screenX - e.screenX, screenY - e.screenY];
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 10) {
        console.log(`Skipping navigation on drag event (${dist}px)`);
        return;
      }
    }
    if (!humanPlayerId) {
      return;
    }
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    const gameSpacePx = viewport.toWorld(e.screenX, e.screenY);
    const tileDim = props.game.worldMap.tileDim;
    const gameSpaceTiles = {
      x: gameSpacePx.x / tileDim,
      y: gameSpacePx.y / tileDim,
    };
    setLastDestination({ t: Date.now(), ...gameSpaceTiles });
    const roundedTiles = {
      x: Math.floor(gameSpaceTiles.x),
      y: Math.floor(gameSpaceTiles.y),
    };
    console.log(`Moving to ${JSON.stringify(roundedTiles)}`);
    await toastOnError(moveTo({ playerId: humanPlayerId, destination: roundedTiles }));
  };
  const { width, height, tileDim } = props.game.worldMap;
  const players = [...props.game.world.players.values()];

  // Zoom on the user’s avatar when it is created
  useEffect(() => {
    if (!viewportRef.current || humanPlayerId === undefined) return;

    const humanPlayer = props.game.world.players.get(humanPlayerId)!;
    viewportRef.current.animate({
      position: new PIXI.Point(humanPlayer.position.x * tileDim, humanPlayer.position.y * tileDim),
      scale: 1.5,
    });
  }, [humanPlayerId]);

  return (
    <PixiViewport
      app={pixiApp}
      screenWidth={props.width}
      screenHeight={props.height}
      worldWidth={width * tileDim}
      worldHeight={height * tileDim}
      viewportRef={viewportRef}
    >
      <PixiStaticMap
        map={props.game.worldMap}
        onpointerup={onMapPointerUp}
        onpointerdown={onMapPointerDown}
      />
      {players.map(
        (p) =>
          // Only show the path for the human player in non-debug mode.
          (SHOW_DEBUG_UI || p.id === humanPlayerId) && (
            <DebugPath key={`path-${p.id}`} player={p} tileDim={tileDim} />
          ),
      )}
      {lastDestination && <PositionIndicator destination={lastDestination} tileDim={tileDim} />}
      {players.map((p) => (
        <Player
          key={`player-${p.id}`}
          game={props.game}
          player={p}
          isViewer={p.id === humanPlayerId}
          onClick={props.setSelectedElement}
          historicalTime={props.historicalTime}
        />
      ))}
      <PoiLabels tileDim={tileDim} />
    </PixiViewport>
  );
};
export default PixiGame;

// POI overlay: colored zones + labels on the PIXI map
import { PixiComponent } from '@pixi/react';

const POI_ZONES = [
  { name: 'House A', x1: 2, y1: 2, x2: 8, y2: 8, color: 0x5a6988 },
  { name: 'House B', x1: 2, y1: 36, x2: 8, y2: 42, color: 0x5a6988 },
  { name: 'House C', x1: 40, y1: 1, x2: 45, y2: 5, color: 0x5a6988 },
  { name: 'Restaurant', x1: 32, y1: 2, x2: 37, y2: 9, color: 0xe4a672 },
  { name: 'Town Square', x1: 24, y1: 21, x2: 31, y2: 28, color: 0xc0cbdc },
  { name: 'Welfare', x1: 45, y1: 33, x2: 47, y2: 37, color: 0xac3232 },
  { name: 'Park', x1: 15, y1: 35, x2: 25, y2: 42, color: 0x6abe30 },
  { name: 'Forest', x1: 1, y1: 15, x2: 8, y2: 25, color: 0x37946e },
  { name: 'Herb Garden', x1: 50, y1: 38, x2: 58, y2: 44, color: 0x4b692f },
];

const PoiLabels = PixiComponent('PoiOverlay', {
  create: (props: { tileDim: number }) => {
    const container = new PIXI.Container();
    const td = props.tileDim;
    const cl = 6; // corner bracket length in pixels

    for (const poi of POI_ZONES) {
      const x = poi.x1 * td;
      const y = poi.y1 * td;
      const w = (poi.x2 - poi.x1) * td;
      const h = (poi.y2 - poi.y1) * td;

      // Corner brackets — subtle, not a full rectangle
      const g = new PIXI.Graphics();
      g.lineStyle(1, poi.color, 0.35);
      g.moveTo(x, y + cl); g.lineTo(x, y); g.lineTo(x + cl, y);
      g.moveTo(x + w - cl, y); g.lineTo(x + w, y); g.lineTo(x + w, y + cl);
      g.moveTo(x, y + h - cl); g.lineTo(x, y + h); g.lineTo(x + cl, y + h);
      g.moveTo(x + w - cl, y + h); g.lineTo(x + w, y + h); g.lineTo(x + w, y + h - cl);
      container.addChild(g);

      // Label — pixel font, muted, blends with game
      const text = new PIXI.Text(poi.name, {
        fontSize: 7,
        fill: poi.color,
        stroke: 0x181425,
        strokeThickness: 2,
        fontFamily: 'Upheaval Pro, monospace',
        letterSpacing: 0.5,
      });
      text.x = x + w / 2;
      text.y = y - 2;
      text.anchor.set(0.5, 1);
      text.alpha = 0.55;
      container.addChild(text);
    }
    return container;
  },
  applyProps: () => {},
});
