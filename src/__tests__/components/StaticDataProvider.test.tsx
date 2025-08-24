/**
 * Tests for StaticDataProvider
 * Verifies the React context provider for static data management
 */

import React from 'react';
import { render, renderHook, waitFor, screen } from '@testing-library/react';
import { StaticDataProvider, useStaticData, useStaticQuery } from '../../components/StaticDataProvider';

// Mock the static database
jest.mock('../../lib/staticDb', () => ({
  initializeStaticDb: jest.fn(() => Promise.resolve({
    db: 'mock-db',
    connection: 'mock-connection'
  })),
  staticDb: {
    query: jest.fn(() => Promise.resolve([])),
    prepare: jest.fn(() => Promise.resolve({ query: jest.fn(() => Promise.resolve([])) }))
  },
  initializeDefaultData: jest.fn(() => Promise.resolve())
}));

// Test component that uses the context
const TestComponent: React.FC = () => {
  const { db, isReady, error } = useStaticData();
  
  return (
    <div>
      <div data-testid="is-ready">{isReady.toString()}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="db">{db ? 'db-present' : 'no-db'}</div>
    </div>
  );
};

// Test component that uses static query
const QueryTestComponent: React.FC = () => {
  const data = useStaticQuery(async (db) => {
    return { message: 'test-data' };
  });
  
  return (
    <div data-testid="query-result">
      {data ? JSON.stringify(data) : 'no-data'}
    </div>
  );
};

describe('StaticDataProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Provider Component', () => {
    it('should render children and provide context', async () => {
      render(
        <StaticDataProvider>
          <TestComponent />
        </StaticDataProvider>
      );

      // Initially not ready
      expect(screen.getByTestId('is-ready')).toHaveTextContent('false');
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('is-ready')).toHaveTextContent('true');
      });

      expect(screen.getByTestId('db')).toHaveTextContent('db-present');
    });

    it('should handle initialization errors', async () => {
      const { initializeStaticDb } = require('../../lib/staticDb');
      initializeStaticDb.mockRejectedValueOnce(new Error('Initialization failed'));

      render(
        <StaticDataProvider>
          <TestComponent />
        </StaticDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Initialization failed');
      });

      expect(screen.getByTestId('is-ready')).toHaveTextContent('false');
    });

    it('should initialize database and default data on mount', async () => {
      const { initializeStaticDb, initializeDefaultData } = require('../../lib/staticDb');

      render(
        <StaticDataProvider>
          <TestComponent />
        </StaticDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('is-ready')).toHaveTextContent('true');
      });

      expect(initializeStaticDb).toHaveBeenCalledTimes(1);
      expect(initializeDefaultData).toHaveBeenCalledTimes(1);
    });
  });

  describe('useStaticData Hook', () => {
    it('should provide context values', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <StaticDataProvider>{children}</StaticDataProvider>
      );

      const { result } = renderHook(() => useStaticData(), { wrapper });

      expect(result.current).toHaveProperty('db');
      expect(result.current).toHaveProperty('isReady');
      expect(result.current).toHaveProperty('error');
    });

    it('should throw error when used outside provider', () => {
      const { result } = renderHook(() => useStaticData());

      expect(result.error).toEqual(
        Error('useStaticData must be used within StaticDataProvider')
      );
    });

    it('should update isReady state after initialization', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <StaticDataProvider>{children}</StaticDataProvider>
      );

      const { result } = renderHook(() => useStaticData(), { wrapper });

      // Initially not ready
      expect(result.current.isReady).toBe(false);

      // Wait for initialization
      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('useStaticQuery Hook', () => {
    it('should execute query when provider is ready', async () => {
      const mockQueryFn = jest.fn(async (db) => ({ result: 'test-data' }));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <StaticDataProvider>{children}</StaticDataProvider>
      );

      const { result } = renderHook(() => useStaticQuery(mockQueryFn), { wrapper });

      // Initially null
      expect(result.current).toBe(null);

      // Wait for query to execute
      await waitFor(() => {
        expect(result.current).toEqual({ result: 'test-data' });
      });

      expect(mockQueryFn).toHaveBeenCalledTimes(1);
    });

    it('should not execute query when provider is not ready', () => {
      const mockQueryFn = jest.fn();

      // Mock provider to never be ready
      const { initializeStaticDb } = require('../../lib/staticDb');
      initializeStaticDb.mockImplementation(() => new Promise(() => {})); // Never resolves

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <StaticDataProvider>{children}</StaticDataProvider>
      );

      const { result } = renderHook(() => useStaticQuery(mockQueryFn), { wrapper });

      expect(result.current).toBe(null);
      expect(mockQueryFn).not.toHaveBeenCalled();
    });

    it('should handle query errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockQueryFn = jest.fn(async () => {
        throw new Error('Query failed');
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <StaticDataProvider>{children}</StaticDataProvider>
      );

      const { result } = renderHook(() => useStaticQuery(mockQueryFn), { wrapper });

      await waitFor(() => {
        expect(result.current).toBe(null);
      });

      expect(consoleSpy).toHaveBeenCalledWith('Static query error:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should re-execute query when dependencies change', async () => {
      const mockQueryFn = jest.fn(async (db) => ({ timestamp: Date.now() }));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <StaticDataProvider>{children}</StaticDataProvider>
      );

      const { result, rerender } = renderHook(
        ({ deps }) => useStaticQuery(mockQueryFn, deps),
        { 
          wrapper,
          initialProps: { deps: ['dep1'] }
        }
      );

      await waitFor(() => {
        expect(result.current).not.toBe(null);
      });

      const firstResult = result.current;
      expect(mockQueryFn).toHaveBeenCalledTimes(1);

      // Change dependencies
      rerender({ deps: ['dep2'] });

      await waitFor(() => {
        expect(result.current).not.toEqual(firstResult);
      });

      expect(mockQueryFn).toHaveBeenCalledTimes(2);
    });

    it('should cancel previous query if component unmounts', async () => {
      let resolveQuery: (value: any) => void;
      const mockQueryFn = jest.fn(() => new Promise((resolve) => {
        resolveQuery = resolve;
      }));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <StaticDataProvider>{children}</StaticDataProvider>
      );

      const { result, unmount } = renderHook(() => useStaticQuery(mockQueryFn), { wrapper });

      // Wait for query to start
      await waitFor(() => {
        expect(mockQueryFn).toHaveBeenCalled();
      });

      unmount();

      // Resolve after unmount - should not update state
      resolveQuery({ result: 'late-data' });

      // Result should still be null since component was unmounted
      expect(result.current).toBe(null);
    });
  });

  describe('Integration Tests', () => {
    it('should work with components that use both hooks', async () => {
      render(
        <StaticDataProvider>
          <QueryTestComponent />
        </StaticDataProvider>
      );

      // Initially no data
      expect(screen.getByTestId('query-result')).toHaveTextContent('no-data');

      // Wait for query to execute
      await waitFor(() => {
        expect(screen.getByTestId('query-result')).toHaveTextContent('{"message":"test-data"}');
      });
    });
  });
});