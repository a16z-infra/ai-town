import { useState } from 'react';
import PixiGame from './PixiGame.tsx';

import { useElementSize } from 'usehooks-ts';
import { Id } from '../../convex/_generated/dataModel';
import { Stage } from '@pixi/react';
import { ConvexProvider, useConvex, useQuery } from 'convex/react';
import PlayerDetails from './PlayerDetails.tsx';
import { api } from '../../convex/_generated/api';
import { useWorldHeartbeat } from '../hooks/useWorldHeartbeat.ts';
import { useHistoricalTime } from '../hooks/useHistoricalTime.ts';
import { DebugTimeManager } from './DebugTimeManager.tsx';

const SHOW_ENGINE_STATS = true;

export default function Game() {
  const convex = useConvex();
  const [selectedElement, setSelectedElement] = useState<{ kind: 'player'; id: Id<'players'> }>();
  const [gameWrapperRef, { width, height }] = useElementSize();

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
    const interval = setInterval(updateOffset, HEARTBEAT_PERIOD);
    return () => clearInterval(interval);
  }, [worldId]);
  return offset;
};
