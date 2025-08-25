import { useMutation, useQuery, api } from '../lib/staticConvexReplaceSimple.tsx';
import { useEffect } from 'react';
import { WORLD_HEARTBEAT_INTERVAL } from '../lib/constants.ts';

export function useWorldHeartbeat() {
  const worldStatus = useQuery(api.world.defaultWorldStatus) as any;
  const worldId = worldStatus?.worldId;

  // Send a periodic heartbeat to our world to keep it alive.
  const heartbeat = useMutation(api.world.heartbeatWorld);
  useEffect(() => {
    const sendHeartBeat = () => {
      if (!worldStatus) {
        return;
      }
      // Don't send a heartbeat if we've observed one sufficiently close
      // to the present.
      if (Date.now() - WORLD_HEARTBEAT_INTERVAL / 2 < worldStatus.lastViewed) {
        return;
      }
      void heartbeat({ worldId: worldStatus.worldId });
    };
    sendHeartBeat();
    const id = setInterval(sendHeartBeat, WORLD_HEARTBEAT_INTERVAL);
    return () => clearInterval(id);
    // Rerun if the `worldId` changes but not `worldStatus`, since don't want to
    // resend the heartbeat whenever its last viewed timestamp changes.
  }, [worldId, heartbeat]);
}
