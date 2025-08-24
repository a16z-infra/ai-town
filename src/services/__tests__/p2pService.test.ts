import { P2PService } from '../p2pService';
import { parseGameId } from '../../../convex/aiTown/ids';

describe('P2PService', () => {
  let p2pService: P2PService;

  beforeEach(() => {
    p2pService = new P2PService({
      enableDiscovery: false, // Disable for testing
      announceInterval: 1000,
    });
  });

  afterEach(async () => {
    if (p2pService.isRunning()) {
      await p2pService.stop();
    }
  });

  test('should initialize with default config', () => {
    expect(p2pService.isRunning()).toBe(false);
    expect(p2pService.getPeerId()).toBe(null);
  });

  test('should return empty players list when not started', async () => {
    const players = await p2pService.findPlayersNearPosition({ x: 0, y: 0 });
    expect(players).toEqual([]);
  });

  test('should return empty discovered players when not started', () => {
    const players = p2pService.getDiscoveredPlayers();
    expect(players).toEqual([]);
  });

  // Note: We can't test the actual libp2p start/stop in the test environment
  // without mocking it, as it requires browser APIs that aren't available in Jest
  test('should handle announce player when not started', async () => {
    // Should not throw an error, just log a warning
    await expect(p2pService.announcePlayer({
      playerId: parseGameId('players', 'p:123'),
      peerId: 'test-peer',
      name: 'Test Player',
      position: { x: 10, y: 10 },
      timestamp: Date.now(),
    })).resolves.toBeUndefined();
  });
});