import { useApp } from '@pixi/react';
import { Player, SelectElement } from './Player.tsx';
import { useRef } from 'react';
import { PixiStaticMap } from './PixiStaticMap.tsx';
import PixiViewport from './PixiViewport.tsx';
import { Viewport } from 'pixi-viewport';
import { Id } from '../../convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api.js';
import { useSendInput } from '../hooks/sendInput.ts';
import { toastOnError } from '../toasts.ts';

export const PixiGame = (props: {
  worldId: Id<'worlds'>;
  historicalTime: number | undefined;
  width: number;
  height: number;
  setSelectedElement: SelectElement;
}) => {
  // PIXI setup.
  const pixiApp = useApp();
  const viewportRef = useRef<Viewport | undefined>();

  const world = useQuery(api.world.defaultWorld);

  const humanPlayerId = useQuery(api.world.userStatus, { worldId: props.worldId }) ?? null;
  const players = useQuery(api.world.activePlayers, { worldId: props.worldId }) ?? [];
  const moveTo = useSendInput(props.worldId, 'moveTo');

  // Interaction for clicking on the world to navigate.
  const dragStart = useRef<{ screenX: number; screenY: number } | null>(null);
  const onMapPointerDown = (e: any) => {
    // https://pixijs.download/dev/docs/PIXI.FederatedPointerEvent.html
    dragStart.current = { screenX: e.screenX, screenY: e.screenY };
  };
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
    if (!viewport || !world) {
      return;
    }
    const gameSpacePx = viewport.toWorld(e.screenX, e.screenY);
    const gameSpaceTiles = {
      x: Math.floor(gameSpacePx.x / world.map.tileDim),
      y: Math.floor(gameSpacePx.y / world.map.tileDim),
    };
    console.log(`Moving to ${JSON.stringify(gameSpaceTiles)}`);
    await toastOnError(moveTo({ playerId: humanPlayerId, destination: gameSpaceTiles }));
  };
  if (!world) {
    return null;
  }
  return (
    <PixiViewport
      app={pixiApp}
      screenWidth={props.width}
      screenHeight={props.height}
      worldWidth={world.map.tileSetDim}
      worldHeight={world.map.tileSetDim}
      viewportRef={viewportRef}
    >
      <PixiStaticMap
        map={world.map}
        onpointerup={onMapPointerUp}
        onpointerdown={onMapPointerDown}
      />
      {players.map((p) => (
        <Player
          key={p._id}
          player={p}
          isViewer={p._id === humanPlayerId}
          onClick={props.setSelectedElement}
          historicalTime={props.historicalTime}
        />
      ))}
    </PixiViewport>
  );
};
export default PixiGame;
