import { useMutation } from 'convex/react';
import { Id } from '../../convex/_generated/dataModel';
import { useEffect } from 'react';
import { api } from '../../convex/_generated/api';
import { WORLD_HEARTBEAT_INTERVAL } from '../../convex/constants';

export function useWorldHeartbeat(worldId?: Id<'worlds'>) {
  // Send a periodic heartbeat to our world to keep it alive.
  const heartbeat = useMutation(api.world.heartbeatWorld);
  useEffect(() => {
    worldId && heartbeat({ worldId });
    const id = setInterval(() => {
      worldId && heartbeat({ worldId });
    }, WORLD_HEARTBEAT_INTERVAL);
    return () => clearInterval(id);
  }, [worldId, heartbeat]);
}
