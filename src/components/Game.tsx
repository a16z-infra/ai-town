import { useRef, useState } from 'react';
import { useElementSize } from 'usehooks-ts';
// import { useConvex, useQuery } from 'convex/react'; // Removed Convex imports
import PlayerDetails from './PlayerDetails.tsx';
// import { api } from '../../convex/_generated/api'; // Removed Convex api
import ThreeScene from './ThreeScene.tsx';
// import { useWorldHeartbeat } from '../hooks/useWorldHeartbeat.ts'; // Removed Convex-dependent hook
import { useHistoricalTime } from '../hooks/useHistoricalTime.ts';
import { DebugTimeManager } from './DebugTimeManager.tsx';
import { GameId } from '../../convex/aiTown/ids.ts'; // This is okay, just a type definition
// import { useServerGame } from '../hooks/serverGame.ts'; // Removed Convex-dependent hook

import { db } from '../db'; // Import Dexie db instance
import { useLiveQuery } from 'dexie-react-hooks';
import { defaultEngineId, defaultWorldId } from '../data/defaultGameData.ts'; // For fallback

export const SHOW_DEBUG_UI = !!import.meta.env.VITE_SHOW_DEBUG_UI;

export default function Game() {
  // const convex = useConvex(); // Removed
  const [selectedElement, setSelectedElement] = useState<{
    kind: 'player';
    id: GameId<'players'>; // Keep GameId type for now, it's just a branded string
  }>();
  const [gameWrapperRef, { width, height }] = useElementSize();

  // Fetch World Status from Dexie
  const worldStatusFromDb = useLiveQuery(
    () => db.worldStatus.where({ isDefault: 1 }).first(), // Dexie stores boolean true as 1
    [], // Dependencies array
    undefined // Initial value
  );

  const worldId = worldStatusFromDb?.worldId ?? defaultWorldId; // Fallback to default if undefined
  const engineId = worldStatusFromDb?.engineId ?? defaultEngineId; // Fallback

  // const game = useServerGame(worldId); // Removed Convex-dependent hook
  const game = undefined; // Placeholder, as useServerGame was removed

  // useWorldHeartbeat(); // Removed Convex-dependent hook

  // Fetch Engine Status from Dexie for useHistoricalTime
  const engineStatusFromDb = useLiveQuery(
    () => (engineId ? db.engines.where({ engineId: engineId }).first() : undefined),
    [engineId], // Dependencies
    undefined // Initial value
  );
  
  // Pass engineStatusFromDb (Engine object from Dexie) to useHistoricalTime
  const { timeManager } = useHistoricalTime(engineStatusFromDb);

  const scrollViewRef = useRef<HTMLDivElement>(null);

  // Updated loading condition: wait for worldStatusFromDb and engineStatusFromDb to be resolved from Dexie
  // Checking for worldId and engineId (which have fallbacks) is not enough.
  // We need to ensure the live queries have had a chance to run.
  if (!worldStatusFromDb || !engineStatusFromDb) {
     console.log("Game component waiting for Dexie data...", { worldStatusFromDb, engineStatusFromDb });
    return <div>Loading game data from local database...</div>; // Or a more sophisticated loading screen
  }
  
  // If we reached here, worldStatusFromDb and engineStatusFromDb should be populated.
  // worldId and engineId will be derived from them, or fallbacks if initial load is too fast.

  return (
    <>
      {SHOW_DEBUG_UI && timeManager && <DebugTimeManager timeManager={timeManager} width={200} height={100} />}
      <div className="mx-auto w-full max-w grid grid-rows-[240px_1fr] lg:grid-rows-[1fr] lg:grid-cols-[1fr_auto] lg:grow max-w-[1400px] min-h-[480px] game-frame">
        {/* Game area */}
        <div className="relative overflow-hidden bg-brown-900" ref={gameWrapperRef}>
          <div className="absolute inset-0">
            { width > 0 && height > 0 && <ThreeScene width={width} height={height} /> }
          </div>
        </div>
        {/* Right column area */}
        <div
          className="flex flex-col overflow-y-auto shrink-0 px-4 py-6 sm:px-6 lg:w-96 xl:pr-6 border-t-8 sm:border-t-0 sm:border-l-8 border-brown-900  bg-brown-800 text-brown-100"
          ref={scrollViewRef}
        >
          <PlayerDetails
            worldId={worldId} // From Dexie or fallback
            engineId={engineId} // From Dexie or fallback
            game={game} // Currently undefined
            playerId={selectedElement?.id}
            setSelectedElement={setSelectedElement}
            scrollViewRef={scrollViewRef}
          />
        </div>
      </div>
    </>
  );
}
