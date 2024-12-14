import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface GameState {
  id: number;
  currentGeneration: number;
  generationEndTime: string | null; // ISO date string
  updatedAt: string; // ISO date string
}

const API_URL = import.meta.env.VITE_API_ROUTE_URL;

const fetchGameState = async (): Promise<GameState | null> => {
  const response = await fetch(`${API_URL}/api/game-state`);
  if (!response.ok) {
    throw new Error('Failed to fetch game state');
  }
  return response.json();
};

const useCountdown = (endTime: string | null) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!endTime) return;

    const calculateTimeLeft = () => {
      const end = new Date(endTime).getTime();
      const now = new Date().getTime();
      const difference = end - now;

      if (difference <= 0) {
        setTimeLeft('00:00:00');
        return false;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
          .toString()
          .padStart(2, '0')}`,
      );
      return true;
    };

    // Initial calculation
    const shouldContinue = calculateTimeLeft();
    if (!shouldContinue) return;

    // Update every second
    const interval = setInterval(() => {
      const shouldContinue = calculateTimeLeft();
      if (!shouldContinue) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  return timeLeft;
};

export default function GenerationStatus() {
  const { data: gameState, status } = useQuery({
    queryKey: ['gameState'],
    queryFn: fetchGameState,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const timeLeft = useCountdown(gameState?.generationEndTime ?? null);

  if (status === 'pending') {
    return (
      <div className="text-center py-4">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#eeff99]"></div>
      </div>
    );
  }

  // Game not started
  if (status === 'error' || !gameState) {
    return (
      <div className="text-center py-4 font-display text-2xl text-[#eeff99] bg-black/80 rounded-lg p-4 mb-4">
        SOLANA TOWN HAS NOT BEEN STARTED YET
      </div>
    );
  }

  // Generation is being born
  if (gameState.generationEndTime === null) {
    return (
      <div className="text-center py-4 font-display text-2xl text-[#eeff99] bg-black/80 rounded-lg p-4 mb-4">
        GENERATION <span className="font-numbers">{gameState.currentGeneration}</span> IS BEING
        BORN... PLEASE WAIT FOR AN UPDATE
      </div>
    );
  }

  // Timer active until next generation
  return (
    <div className="text-center py-4 font-display text-2xl text-[#eeff99] bg-black/80 rounded-lg p-4 mb-4">
      GENERATION <span className="font-numbers">{gameState.currentGeneration}</span> HATCHING WILL
      BEGIN IN <span className="font-numbers">{timeLeft}</span>
      <div className="text-sm mt-2">
        TOP <span className="font-numbers">10</span> RANKED CITIZENS WILL BE HATCHED
      </div>
    </div>
  );
}
