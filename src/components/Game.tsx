import { Stage } from '@pixi/react';
import { useEffect, useRef, useState } from 'react';
import { PixiStaticMap } from './PixiStaticMap.tsx';
import { ConvexProvider, useConvex, useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Player, SelectPlayer } from './Player.tsx';
import { HEARTBEAT_PERIOD } from '../../convex/config.ts';
import { Id } from '../../convex/_generated/dataModel';
import PixiViewport from "./PixiViewport.tsx";

export const Game = ({
  setSelectedPlayer,
  width,
  height,
}: {
  setSelectedPlayer: SelectPlayer;
  width: number;
  height: number;
}) => {
  const convex = useConvex();
  const worldState = useQuery(api.players.getWorld, {});
  const offset = useServerTimeOffset(worldState?.world._id);
  if (!worldState) return null;
  const { players } = worldState;
  return (
    <div className="container">
      <Stage width={width} height={height} options={{ backgroundColor: 0x7ab5ff }}>
        <PixiViewport
          screenWidth={width}
          screenHeight={height}
          worldWidth={worldState.map.tileSetDim}
          worldHeight={worldState.map.tileSetDim}
        >
          <PixiStaticMap map={worldState.map}></PixiStaticMap>
          {/* Re-propagate context because contexts are not shared between renderers.
https://github.com/michalochman/react-pixi-fiber/issues/145#issuecomment-531549215 */}
          <ConvexProvider client={convex}>
            {players.map((player) => (
              <Player
                key={player._id}
                player={player}
                offset={offset}
                tileDim={worldState.map.tileDim}
                onClick={setSelectedPlayer}
              />
            ))}
          </ConvexProvider>
        </PixiViewport>
      </Stage>
    </div>
  );
};
export default Game;

/**
 * Calculates the time delta between the server's clock and ours, from
 * the point of view of the receiver. When the network is relatively stable,
 * this means updates come down roughly when they happen in game-time.
 * We use a rolling average, discarding the max & min values as outliers.
 *
 * @returns The average offset between the server and the client
 */
const useServerTimeOffset = (worldId: Id<'worlds'> | undefined) => {
  const serverNow = useMutation(api.players.now);
  const [offset, setOffset] = useState(0);
  const prev = useRef<number[]>([]);
  useEffect(() => {
    const updateOffset = async () => {
      if (!worldId) return;
      let serverTime;
      try {
        serverTime = await serverNow({ worldId });
      } catch (e) {
        // If we failed to get it, just skip this one
        return;
      }
      const newOffset = serverTime - Date.now();
      prev.current.push(newOffset);
      if (prev.current.length > 5) prev.current.shift();
      const rollingOffset =
        prev.current.length < 3
          ? prev.current
          : // Take off the max & min as outliers
            [...prev.current].sort().slice(1, -1);
      const avgOffset = rollingOffset.reduce((a, b) => a + b, 0) / rollingOffset.length;
      setOffset(avgOffset);
    };
    void updateOffset();
    const interval = setInterval(() => {
      void updateOffset();
    }, HEARTBEAT_PERIOD);
    return () => clearInterval(interval);
  }, [worldId]);
  return offset;
};
