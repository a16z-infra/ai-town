'use client';
import { useState } from 'react';
import PlayerDetails from './PlayerDetails';
import Game from './Game';

import { useElementSize } from 'usehooks-ts';
import { Id } from '../../convex/_generated/dataModel';

export default function GameWrapper() {
  const [selectedPlayer, setSelectedPlayer] = useState<Id<'players'>>();

  const [gameWrapperRef, { width, height }] = useElementSize();

  return (
    <div className="mx-auto w-full max-w mt-7 grid grid-rows-[240px_1fr] lg:grid-rows-[1fr] lg:grid-cols-[1fr_auto] lg:h-[700px] max-w-[1400px] min-h-[480px] game-frame">
      {/* Game area */}
      <div className="relative overflow-hidden bg-brown-900" ref={gameWrapperRef}>
        <div className="absolute inset-0">
          <Game width={width} height={height} setSelectedPlayer={setSelectedPlayer} />
        </div>
      </div>

      {/* Right column area */}
      <div className="flex flex-col overflow-y-auto shrink-0 px-4 py-6 sm:px-6 lg:w-96 xl:pr-6 bg-brown-800 text-brown-100">
        {selectedPlayer ? (
          <PlayerDetails playerId={selectedPlayer} />
        ) : (
          <div className="h-full text-xl flex text-center items-center p-4">
            Click on an agent on the map to see chat history.
          </div>
        )}
      </div>
    </div>
  );
}
