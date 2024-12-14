import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface Generation {
  id: string;
  name: string;
  wallet: string;
  tokenBalance: string;
  avatarUrl: string;
  isBorn: boolean;
  imageUrl: string;
  signature: string;
  character: string;
  identity: string;
  createdAt: string;
  bornAt?: string;
}

interface LeaderboardResponse {
  items: Generation[];
  metadata: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
    nextOffset: number | null;
  };
}

const API_URL = import.meta.env.VITE_API_ROUTE_URL;

// Add utility function for shortening wallet address
const shortenAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

export default function LeaderboardTable() {
  const { data, status } = useQuery<LeaderboardResponse>({
    queryKey: ['leaderboard', 'born'],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/api/leaderboard?limit=10&includeBorn=true&is_born=true`,
      );
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    },
  });

  const avatars = data?.items ?? [];

  if (status === 'pending') {
    return (
      <div className="bg-black/80 rounded-lg p-6 w-full max-w-4xl">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#eeff99]"></div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="bg-black/80 rounded-lg p-6 w-full max-w-4xl">
        <div className="text-center py-8 text-red-500">Error loading leaderboard</div>
      </div>
    );
  }

  if (avatars.length === 0) {
    return (
      <div className="bg-black/80 rounded-lg p-6 w-full max-w-4xl">
        <div className="text-center py-8 text-[#eeff99] font-display text-xl">
          NO CITIZENS BORN YET
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/80 rounded-lg p-6 w-full max-w-4xl">
      <div className="grid grid-cols-6 gap-4 text-[#eeff99] font-display text-xl mb-6">
        <div>RANK</div>
        <div>AVATAR</div>
        <div>NAME</div>
        <div>WALLET</div>
        <div>$TOWN</div>
        <div>BORN</div>
      </div>
      <div className="space-y-4">
        {avatars.map((item, index) => (
          <div
            key={item.id}
            className="grid grid-cols-6 gap-4 items-center bg-black/40 rounded p-4 text-white"
          >
            <div className="font-display text-[#eeff99]">
              <span className="font-numbers">#{index + 1}</span>
            </div>
            <div className="flex items-center justify-center">
              <img
                src={item.avatarUrl}
                alt={item.name}
                className="w-16 h-16 object-contain rounded brightness-90"
              />
            </div>
            <div className="font-display">{item.name}</div>
            <div className="font-display truncate">{shortenAddress(item.wallet)}</div>
            <div className="font-display">
              <span className="font-numbers">{item.tokenBalance}</span>
            </div>
            <div className="font-display">
              <span className="font-numbers">
                {item.bornAt ? new Date(item.bornAt).toLocaleDateString() : 'Not born'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
