import { useEffect, useState, useCallback } from 'react';
import { p2pService, P2PPlayerInfo } from '../services/p2pService';
import type { GameId } from '../../convex/aiTown/ids';

export interface P2PStatus {
  isConnected: boolean;
  peerId: string | null;
  discoveredPlayers: P2PPlayerInfo[];
  error: string | null;
}

export function useP2P() {
  const [status, setStatus] = useState<P2PStatus>({
    isConnected: false,
    peerId: null,
    discoveredPlayers: [],
    error: null,
  });

  // Initialize P2P service
  const initializeP2P = useCallback(async () => {
    try {
      if (p2pService.isRunning()) {
        return;
      }

      await p2pService.start();
      setStatus(prev => ({
        ...prev,
        isConnected: true,
        peerId: p2pService.getPeerId(),
        error: null,
      }));
    } catch (error) {
      console.error('Failed to initialize P2P:', error);
      setStatus(prev => ({
        ...prev,
        isConnected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, []);

  // Shutdown P2P service
  const shutdownP2P = useCallback(async () => {
    try {
      await p2pService.stop();
      setStatus({
        isConnected: false,
        peerId: null,
        discoveredPlayers: [],
        error: null,
      });
    } catch (error) {
      console.error('Failed to shutdown P2P:', error);
      setStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, []);

  // Announce player presence
  const announcePlayer = useCallback(async (
    playerId: GameId<'players'>,
    name: string,
    position: { x: number; y: number }
  ) => {
    if (!p2pService.isRunning()) {
      return;
    }

    try {
      const peerId = p2pService.getPeerId();
      if (!peerId) {
        throw new Error('No peer ID available');
      }

      await p2pService.announcePlayer({
        playerId,
        peerId,
        name,
        position,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to announce player:', error);
      setStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, []);

  // Find players near a position
  const findPlayersNearby = useCallback(async (
    position: { x: number; y: number },
    radius: number = 50
  ): Promise<P2PPlayerInfo[]> => {
    if (!p2pService.isRunning()) {
      return [];
    }

    try {
      return await p2pService.findPlayersNearPosition(position, radius);
    } catch (error) {
      console.error('Failed to find nearby players:', error);
      setStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
      return [];
    }
  }, []);

  // Update discovered players periodically
  useEffect(() => {
    if (!p2pService.isRunning()) {
      return;
    }

    const updateDiscoveredPlayers = () => {
      const players = p2pService.getDiscoveredPlayers();
      setStatus(prev => ({
        ...prev,
        discoveredPlayers: players,
      }));
    };

    // Update immediately
    updateDiscoveredPlayers();

    // Set up periodic updates
    const interval = setInterval(updateDiscoveredPlayers, 5000);

    return () => clearInterval(interval);
  }, [status.isConnected]);

  return {
    status,
    initializeP2P,
    shutdownP2P,
    announcePlayer,
    findPlayersNearby,
  };
}

export function useP2PPlayerDiscovery(
  currentPosition: { x: number; y: number },
  searchRadius: number = 100
) {
  const { status, findPlayersNearby } = useP2P();
  const [nearbyPlayers, setNearbyPlayers] = useState<P2PPlayerInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchForPlayers = useCallback(async () => {
    if (!status.isConnected || isSearching) {
      return;
    }

    setIsSearching(true);
    try {
      const players = await findPlayersNearby(currentPosition, searchRadius);
      setNearbyPlayers(players);
    } finally {
      setIsSearching(false);
    }
  }, [status.isConnected, currentPosition, searchRadius, findPlayersNearby, isSearching]);

  // Auto-search periodically
  useEffect(() => {
    if (!status.isConnected) {
      return;
    }

    const interval = setInterval(searchForPlayers, 10000); // Search every 10 seconds
    searchForPlayers(); // Search immediately

    return () => clearInterval(interval);
  }, [status.isConnected, searchForPlayers]);

  return {
    nearbyPlayers,
    isSearching,
    searchForPlayers,
    isP2PConnected: status.isConnected,
  };
}