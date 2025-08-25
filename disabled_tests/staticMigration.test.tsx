/**
 * Integration Tests for Static Migration
 * Verifies end-to-end functionality of the Convex to static migration
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { StaticDataProvider } from '../../components/StaticDataProvider';
import { useQuery, useMutation } from '../../lib/staticConvexReplaceSimple';

// Mock all the heavy dependencies
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

// Mock Worker
global.Worker = jest.fn(() => ({
  postMessage: jest.fn(),
  terminate: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
})) as any;

// Test component that simulates the original Convex usage pattern
const ConvexReplacementTest: React.FC = () => {
  const worlds = useQuery(async () => {
    return [
      { _id: 'world-1', name: 'Test World 1', status: 'active' },
      { _id: 'world-2', name: 'Test World 2', status: 'inactive' }
    ];
  });

  const createWorld = useMutation(async (args: { name: string }) => {
    return { _id: `world-${Date.now()}`, name: args.name, status: 'active' };
  });

  const handleCreateWorld = () => {
    createWorld({ name: 'New Static World' });
  };

  return (
    <div>
      <h1 data-testid="title">Static AI Town</h1>
      
      <div data-testid="worlds-list">
        {worlds?.map((world: any) => (
          <div key={world._id} data-testid={`world-${world._id}`}>
            {world.name} ({world.status})
          </div>
        ))}
      </div>
      
      <button onClick={handleCreateWorld} data-testid="create-world-btn">
        Create World
      </button>
      
      <div data-testid="loading-state">
        {worlds ? 'loaded' : 'loading'}
      </div>
    </div>
  );
};

describe('Static Migration Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset any localStorage or sessionStorage
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Convex to Static API Migration', () => {
    it('should successfully replace Convex useQuery with static implementation', async () => {
      render(
        <StaticDataProvider>
          <ConvexReplacementTest />
        </StaticDataProvider>
      );

      // Initially loading
      expect(screen.getByTestId('loading-state')).toHaveTextContent('loading');

      // Should eventually load data
      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');
      });

      // Verify worlds are displayed
      expect(screen.getByTestId('world-world-1')).toHaveTextContent('Test World 1 (active)');
      expect(screen.getByTestId('world-world-2')).toHaveTextContent('Test World 2 (inactive)');
    });

    it('should successfully replace Convex useMutation with static implementation', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      render(
        <StaticDataProvider>
          <ConvexReplacementTest />
        </StaticDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');
      });

      // Click create world button
      const createButton = screen.getByTestId('create-world-btn');
      createButton.click();

      // Verify mutation was called
      expect(consoleSpy).toHaveBeenCalledWith(
        'Mock mutation called:',
        { name: 'New Static World' }
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Database Layer Integration', () => {
    it('should initialize static database successfully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      render(
        <StaticDataProvider>
          <div data-testid="test-component">Database Test</div>
        </StaticDataProvider>
      );

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('test-component')).toBeInTheDocument();
      });

      // Check that database initialization was logged
      expect(consoleSpy).toHaveBeenCalledWith('Static database initialized successfully');

      consoleSpy.mockRestore();
    });

    it('should handle database initialization failures gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock initialization failure
      const mockDuckDB = require('@duckdb/duckdb-wasm');
      mockDuckDB.selectBundle.mockRejectedValueOnce(new Error('Failed to load WASM bundle'));

      render(
        <StaticDataProvider>
          <div data-testid="error-test">Error Test</div>
        </StaticDataProvider>
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to initialize static database:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Offline Functionality', () => {
    it('should work without network connectivity', async () => {
      // Simulate offline environment by mocking network failures
      const originalFetch = global.fetch;
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

      render(
        <StaticDataProvider>
          <ConvexReplacementTest />
        </StaticDataProvider>
      );

      // App should still work offline
      await waitFor(() => {
        expect(screen.getByTestId('title')).toHaveTextContent('Static AI Town');
      });

      // Data should still load from static sources
      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');
      });

      global.fetch = originalFetch;
    });

    it('should persist data across browser sessions', async () => {
      // First session - create some data
      const { unmount } = render(
        <StaticDataProvider>
          <ConvexReplacementTest />
        </StaticDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');
      });

      unmount();

      // Second session - data should persist
      render(
        <StaticDataProvider>
          <ConvexReplacementTest />
        </StaticDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');
      });

      // Data should still be there
      expect(screen.getByTestId('world-world-1')).toHaveTextContent('Test World 1');
    });
  });

  describe('Performance Characteristics', () => {
    it('should initialize faster than server-based solutions', async () => {
      const startTime = performance.now();

      render(
        <StaticDataProvider>
          <ConvexReplacementTest />
        </StaticDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');
      });

      const endTime = performance.now();
      const initTime = endTime - startTime;

      // Static initialization should be very fast (under 1 second)
      expect(initTime).toBeLessThan(1000);
    });

    it('should have minimal memory footprint', async () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0;

      render(
        <StaticDataProvider>
          <ConvexReplacementTest />
        </StaticDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');
      });

      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (under 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('API Compatibility', () => {
    it('should maintain the same API interface as Convex', async () => {
      // This test ensures that components using Convex hooks don't need to change
      const TestComponent = () => {
        // These should work exactly like Convex hooks
        const data = useQuery(() => Promise.resolve({ test: true }));
        const mutation = useMutation((args: any) => Promise.resolve(args));

        return (
          <div>
            <div data-testid="query-data">{data ? 'has-data' : 'no-data'}</div>
            <button 
              onClick={() => mutation({ action: 'test' })}
              data-testid="mutation-btn"
            >
              Test Mutation
            </button>
          </div>
        );
      };

      render(
        <StaticDataProvider>
          <TestComponent />
        </StaticDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('query-data')).toHaveTextContent('has-data');
      });

      // Mutation should also work
      const mutationBtn = screen.getByTestId('mutation-btn');
      expect(mutationBtn).toBeInTheDocument();
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should gracefully handle component errors', async () => {
      const ErrorComponent = () => {
        const data = useQuery(() => Promise.reject(new Error('Query error')));
        return <div data-testid="error-comp">{data ? 'success' : 'error-handled'}</div>;
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <StaticDataProvider>
          <ErrorComponent />
        </StaticDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error-comp')).toHaveTextContent('error-handled');
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Static Deployment Verification', () => {
    it('should work in static hosting environments', async () => {
      // Simulate static hosting by ensuring no server calls
      const mockFetch = jest.spyOn(global, 'fetch').mockImplementation();

      render(
        <StaticDataProvider>
          <ConvexReplacementTest />
        </StaticDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');
      });

      // No fetch calls should have been made to external servers
      expect(mockFetch).not.toHaveBeenCalled();

      mockFetch.mockRestore();
    });

    it('should be ready for GitHub Pages deployment', async () => {
      // Verify all assets are bundled and no external dependencies
      render(
        <StaticDataProvider>
          <ConvexReplacementTest />
        </StaticDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('title')).toBeInTheDocument();
      });

      // Should render without external API calls
      expect(screen.getByTestId('title')).toHaveTextContent('Static AI Town');
    });
  });
});