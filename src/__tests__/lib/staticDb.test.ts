/**
 * Tests for Static Database Layer
 * Verifies the browser-only database implementation using DuckDB-WASM
 */

import { initializeStaticDb, World, WorldStatus } from '../../lib/staticDb';

// Mock DuckDB-WASM since it requires WebAssembly
jest.mock('@duckdb/duckdb-wasm', () => ({
  getJsDelivrBundles: jest.fn(() => ({})),
  selectBundle: jest.fn(() => Promise.resolve({
    mainWorker: 'mock-worker-url',
    mainModule: 'mock-module-url'
  })),
  ConsoleLogger: jest.fn(() => ({
    log: jest.fn(),
    error: jest.fn()
  })),
  AsyncDuckDB: jest.fn(() => ({
    instantiate: jest.fn(() => Promise.resolve()),
    connect: jest.fn(() => Promise.resolve({
      query: jest.fn(() => Promise.resolve({ toArray: () => [] })),
      prepare: jest.fn(() => Promise.resolve({
        query: jest.fn(() => Promise.resolve({ toArray: () => [] }))
      })),
      close: jest.fn(() => Promise.resolve())
    }))
  }))
}));

// Mock Worker since it's not available in Node.js test environment
global.Worker = jest.fn(() => ({
  postMessage: jest.fn(),
  terminate: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
})) as any;

describe('Static Database Layer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset global database instances
    jest.resetModules();
  });

  describe('initializeStaticDb', () => {
    it('should initialize DuckDB-WASM successfully', async () => {
      const result = await initializeStaticDb();
      
      expect(result).toBeDefined();
      expect(result.db).toBeDefined();
      expect(result.connection).toBeDefined();
    });

    it('should return existing instance on subsequent calls', async () => {
      const first = await initializeStaticDb();
      const second = await initializeStaticDb();
      
      expect(first).toBe(second);
    });

    it('should handle initialization errors gracefully', async () => {
      // Mock an initialization error
      const mockDuckDB = require('@duckdb/duckdb-wasm');
      mockDuckDB.selectBundle.mockRejectedValueOnce(new Error('Bundle load failed'));

      await expect(initializeStaticDb()).rejects.toThrow('Bundle load failed');
    });
  });

  describe('Schema Types', () => {
    it('should define World interface correctly', () => {
      const mockWorld: World = {
        _id: 'world-123',
        nextId: 1,
        agents: ['agent1', 'agent2'],
        conversations: ['conv1', 'conv2'],
        players: ['player1', 'player2']
      };

      expect(mockWorld._id).toBe('world-123');
      expect(mockWorld.nextId).toBe(1);
      expect(mockWorld.agents).toHaveLength(2);
      expect(mockWorld.conversations).toHaveLength(2);
      expect(mockWorld.players).toHaveLength(2);
    });

    it('should define WorldStatus interface correctly', () => {
      const mockWorldStatus: WorldStatus = {
        _id: 'status-123',
        engineId: 'engine-456',
        isDefault: true,
        lastViewed: Date.now(),
        status: 'running',
        worldId: 'world-123'
      };

      expect(mockWorldStatus._id).toBe('status-123');
      expect(mockWorldStatus.status).toBe('running');
      expect(mockWorldStatus.isDefault).toBe(true);
    });
  });

  describe('Database Operations', () => {
    it('should handle database connection lifecycle', async () => {
      const { db, connection } = await initializeStaticDb();
      
      expect(db).toBeDefined();
      expect(connection).toBeDefined();
      
      // Verify connection methods are available
      expect(typeof connection.query).toBe('function');
      expect(typeof connection.prepare).toBe('function');
      expect(typeof connection.close).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should log errors appropriately', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      try {
        const mockDuckDB = require('@duckdb/duckdb-wasm');
        mockDuckDB.AsyncDuckDB.mockImplementationOnce(() => {
          throw new Error('Database creation failed');
        });
        
        await initializeStaticDb();
      } catch (error) {
        // Expected to throw
      }
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to initialize static database:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });
});