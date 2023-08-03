import { Stage } from '@pixi/react';
import { useEffect, useRef, useState } from 'react';
import { ConvexProvider, useConvex, useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Player } from './Player';

const useOffset = () => {
  const serverNow = useMutation(api.players.now);
  const [offset, setOffset] = useState(0);
  const prev = useRef<number[]>([]);
  useEffect(() => {
    const updateOffset = async () => {
      console.log('fetching server time');
      const serverTime = await serverNow();
      const newOffset = serverTime - Date.now();
      prev.current.push(newOffset);
      if (prev.current.length > 5) prev.current.shift();
      console.log(prev.current);
      const rollingOffset =
        prev.current.length === 1
          ? prev.current
          : // Take off the max & min as outliers
            [...prev.current].sort().slice(1, -1);
      const avgOffset = rollingOffset.reduce((a, b) => a + b, 0) / prev.current.length;
      setOffset(avgOffset);
    };
    void updateOffset();
    const interval = setInterval(updateOffset, 1000); // TODO: 10000);
    return () => clearInterval(interval);
  }, []);
  return offset;
};

export const Game = () => {
  const convex = useConvex();
  const worldState = useQuery(api.players.getWorld, {});
  const offset = useOffset();
  if (!worldState) return null;
  const { world, players } = worldState;
  console.log('worldId', world._id);
  return (
    <Stage width={1200} height={800} options={{ backgroundColor: 0xffffff }}>
      <ConvexProvider client={convex}>
        {players
          // .slice(0, 1)
          .map((player) => (
            <Player key={player._id} player={player} offset={offset} />
          ))}
      </ConvexProvider>
    </Stage>
  );
};
export default Game;
