'use client';
import { useState } from 'react';
import Chats from './Chats';
import Game from './Game';
import type { Player } from '../../convex/schema';

import { useElementSize } from 'usehooks-ts';

export default function Examples() {
  const [selectedPlayer, setSelectedPlayer] = useState<Player>();

  const [gameWrapperRef, { width, height }] = useElementSize();
  console.log({ width, height });

  return (
    <>
      <div className="mx-auto flex-1 w-full max-w mt-7 grid grid-rows-[240px_1fr] lg:grid-rows-[1fr] lg:grid-cols-[1fr_auto] lg:max-h-[900px] max-w-[1400px] min-h-[480px]">
        {/* Game area */}
        <div className="relative overflow-hidden bg-slate-400" ref={gameWrapperRef}>
          <div className="absolute inset-0">
            <Game width={width} height={height} setSelectedPlayer={setSelectedPlayer} />
          </div>
        </div>

        {/* Right column area */}
        <div className="flex flex-col overflow-y-auto shrink-0 border-t border-gray-200 px-4 py-6 sm:px-6 lg:w-96 lg:border-l lg:border-t-0 lg:pr-8 xl:pr-6 bg-slate-300 space-y-11">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-neutral-700">
            Conversations
          </h1>
          <Chats playerState={selectedPlayer} />
        </div>
      </div>
    </>
  );
}
