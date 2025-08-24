import { createLibp2p } from 'libp2p';
import type { Libp2p } from 'libp2p';
import type { GameId } from '../../convex/aiTown/ids';

export interface P2PPlayerInfo {
  playerId: GameId<'players'>;
  peerId: string;
  name: string;
  position: { x: number; y: number };
  timestamp: number;
}

export interface P2PServiceConfig {
  enableDiscovery: boolean;
  maxConnections: number;
  announceInterval: number; // ms
}

const DEFAULT_CONFIG: P2PServiceConfig = {
  enableDiscovery: true,
  maxConnections: 50,
  announceInterval: 30000, // 30 seconds
};

export class P2PService {
  private libp2p: Libp2p | null = null;
  private config: P2PServiceConfig;
  private discoveredPlayers = new Map<string, P2PPlayerInfo>();
  private isStarted = false;
  private announceTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<P2PServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async start(): Promise<void> {
    if (this.isStarted) {
      return;
    }

    try {
      // Create a minimal libp2p node for browser environment
      this.libp2p = await createLibp2p({
        addresses: {
          listen: []
        },
        connectionManager: {
          maxConnections: this.config.maxConnections
        }
      });

      await this.libp2p.start();
      this.isStarted = true;

      console.log('P2P Service started with peer ID:', this.libp2p.peerId.toString());

      // Start announcing presence if discovery is enabled
      if (this.config.enableDiscovery) {
        this.startAnnouncing();
      }

      // Listen for connection events
      this.libp2p.addEventListener('connection:open', (evt) => {
        console.log('P2P connection opened:', evt.detail.remotePeer.toString());
      });

      this.libp2p.addEventListener('connection:close', (evt) => {
        console.log('P2P connection closed:', evt.detail.remotePeer.toString());
      });

    } catch (error) {
      console.error('Failed to start P2P service:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isStarted) {
      return;
    }

    this.stopAnnouncing();
    
    if (this.libp2p) {
      await this.libp2p.stop();
      this.libp2p = null;
    }

    this.isStarted = false;
    this.discoveredPlayers.clear();
    console.log('P2P Service stopped');
  }

  async announcePlayer(playerInfo: P2PPlayerInfo): Promise<void> {
    if (!this.isStarted || !this.libp2p) {
      console.warn('Cannot announce player: P2P service not started');
      return;
    }

    try {
      // In a full implementation, this would broadcast the player info
      // For now, we'll just store it locally and log it
      const announcement = {
        ...playerInfo,
        peerId: this.libp2p.peerId.toString(),
        timestamp: Date.now()
      };

      console.log('Announcing player:', announcement);
      
      // TODO: Implement actual peer-to-peer announcement mechanism
      // This would involve broadcasting on a pubsub topic or through DHT
      
    } catch (error) {
      console.error('Failed to announce player:', error);
    }
  }

  getDiscoveredPlayers(): P2PPlayerInfo[] {
    return Array.from(this.discoveredPlayers.values());
  }

  async findPlayersNearPosition(position: { x: number; y: number }, radius: number = 50): Promise<P2PPlayerInfo[]> {
    if (!this.isStarted) {
      return [];
    }

    // Filter discovered players by proximity
    const nearbyPlayers = this.getDiscoveredPlayers().filter(player => {
      const distance = Math.sqrt(
        Math.pow(player.position.x - position.x, 2) + 
        Math.pow(player.position.y - position.y, 2)
      );
      return distance <= radius;
    });

    return nearbyPlayers;
  }

  getPeerId(): string | null {
    return this.libp2p?.peerId.toString() || null;
  }

  isRunning(): boolean {
    return this.isStarted && this.libp2p !== null;
  }

  private startAnnouncing(): void {
    if (this.announceTimer) {
      clearInterval(this.announceTimer);
    }

    this.announceTimer = setInterval(() => {
      // This would typically re-announce our presence
      // For now, just log that we're alive
      console.log('P2P heartbeat - peer alive:', this.getPeerId());
    }, this.config.announceInterval);
  }

  private stopAnnouncing(): void {
    if (this.announceTimer) {
      clearInterval(this.announceTimer);
      this.announceTimer = null;
    }
  }

  // Event handlers for discovered players (would be implemented with pubsub/DHT)
  private handlePlayerDiscovered(playerInfo: P2PPlayerInfo): void {
    this.discoveredPlayers.set(playerInfo.peerId, playerInfo);
    console.log('Discovered player:', playerInfo);
  }

  private handlePlayerLeft(peerId: string): void {
    this.discoveredPlayers.delete(peerId);
    console.log('Player left:', peerId);
  }
}

// Singleton instance for the application
export const p2pService = new P2PService();