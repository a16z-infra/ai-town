export interface Generation {
  id: string;
  name: string;
  wallet: string;
  avatarUrl: string;
  tokenBalance: number;
}

export interface LeaderboardMetadata {
  total: number;
  nextOffset: number | null;
}

export interface LeaderboardResponse {
  items: Generation[];
  metadata: LeaderboardMetadata;
}
