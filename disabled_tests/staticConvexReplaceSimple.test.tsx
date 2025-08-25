/**
 * Tests for Static Convex Replacement
 * Verifies the React hooks that replace Convex functionality
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { useQuery, useMutation, useConvex, Doc, Id } from '../../lib/staticConvexReplaceSimple';

// Mock the StaticDataProvider
jest.mock('../../components/StaticDataProvider', () => ({
  useStaticData: jest.fn(() => ({
    isReady: true,
    data: { worlds: [], players: [], conversations: [] }
  }))
}));

describe('Static Convex Replacement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Type Definitions', () => {
    it('should define Id type correctly', () => {
      const mockId: Id<'worlds'> = 'world-123' as Id<'worlds'>;
      expect(typeof mockId).toBe('string');
      expect(mockId).toBe('world-123');
    });

    it('should define Doc type correctly', () => {
      const mockDoc: Doc<'worlds'> = {
        _id: 'world-123' as Id<'worlds'>,
        _creationTime: Date.now(),
        name: 'Test World'
      };

      expect(mockDoc._id).toBe('world-123');
      expect(typeof mockDoc._creationTime).toBe('number');
      expect(mockDoc.name).toBe('Test World');
    });
  });

  describe('useQuery Hook', () => {
    it('should return undefined when not ready', () => {
      const { useStaticData } = require('../../components/StaticDataProvider');
      useStaticData.mockReturnValueOnce({ isReady: false });

      const mockQueryFn = jest.fn();
      const { result } = renderHook(() => useQuery(mockQueryFn));

      expect(result.current).toBeUndefined();
      expect(mockQueryFn).not.toHaveBeenCalled();
    });

    it('should execute query function when ready', async () => {
      const mockData = { _id: 'test-123', name: 'Test Data' };
      const mockQueryFn = jest.fn(() => Promise.resolve(mockData));

      const { result } = renderHook(() => useQuery(mockQueryFn, { arg: 'test' }));

      await waitFor(() => {
        expect(result.current).toEqual(mockData);
      });

      expect(mockQueryFn).toHaveBeenCalledWith({ arg: 'test' });
    });

    it('should handle query function errors gracefully', async () => {
      const mockQueryFn = jest.fn(() => Promise.reject(new Error('Query failed')));

      const { result } = renderHook(() => useQuery(mockQueryFn));

      await waitFor(() => {
        expect(result.current).toBeUndefined();
      });
    });

    it('should update when query arguments change', async () => {
      const mockQueryFn = jest.fn((args) => Promise.resolve({ ...args, result: 'data' }));

      const { result, rerender } = renderHook(
        ({ args }) => useQuery(mockQueryFn, args),
        { initialProps: { args: { id: 1 } } }
      );

      await waitFor(() => {
        expect(result.current).toEqual({ id: 1, result: 'data' });
      });

      rerender({ args: { id: 2 } });

      await waitFor(() => {
        expect(result.current).toEqual({ id: 2, result: 'data' });
      });

      expect(mockQueryFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('useMutation Hook', () => {
    it('should return a function that calls the mutation', async () => {
      const mockResult = { success: true, id: 'new-123' };
      const mockMutationFn = jest.fn(() => Promise.resolve(mockResult));

      const { result } = renderHook(() => useMutation(mockMutationFn));
      const mutationFn = result.current;

      const mutationResult = await mutationFn({ data: 'test' });

      expect(mockMutationFn).toHaveBeenCalledWith({ data: 'test' });
      expect(mutationResult).toEqual(mockResult);
    });

    it('should handle mutation errors gracefully', async () => {
      const mockMutationFn = jest.fn(() => Promise.reject(new Error('Mutation failed')));

      const { result } = renderHook(() => useMutation(mockMutationFn));
      const mutationFn = result.current;

      const mutationResult = await mutationFn({ data: 'test' });

      expect(mutationResult).toEqual({});
    });

    it('should log mutation calls for debugging', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockMutationFn = jest.fn(() => Promise.resolve({}));

      const { result } = renderHook(() => useMutation(mockMutationFn));
      const mutationFn = result.current;

      await mutationFn({ action: 'create', data: 'test' });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Mock mutation called:',
        { action: 'create', data: 'test' }
      );

      consoleSpy.mockRestore();
    });
  });

  describe('useConvex Hook', () => {
    it('should return an object with watchQuery and mutation methods', () => {
      const { result } = renderHook(() => useConvex());
      const convex = result.current;

      expect(convex).toHaveProperty('watchQuery');
      expect(convex).toHaveProperty('mutation');
      expect(typeof convex.watchQuery).toBe('function');
      expect(typeof convex.mutation).toBe('function');
    });

    it('should handle watchQuery calls', async () => {
      const { result } = renderHook(() => useConvex());
      const convex = result.current;

      const mockQueryFn = jest.fn();
      const watchResult = await convex.watchQuery(mockQueryFn, { id: 'test' });

      expect(watchResult).toEqual({});
    });

    it('should handle mutation calls', async () => {
      const { result } = renderHook(() => useConvex());
      const convex = result.current;

      const mockMutationFn = jest.fn();
      const mutationResult = await convex.mutation(mockMutationFn, { data: 'test' });

      expect(mutationResult).toEqual({});
    });
  });

  describe('Integration with StaticDataProvider', () => {
    it('should respect isReady state from StaticDataProvider', () => {
      const { useStaticData } = require('../../components/StaticDataProvider');
      
      // First render with not ready
      useStaticData.mockReturnValueOnce({ isReady: false });
      const { result, rerender } = renderHook(() => useQuery(() => Promise.resolve('data')));
      
      expect(result.current).toBeUndefined();

      // Second render with ready
      useStaticData.mockReturnValueOnce({ isReady: true });
      rerender();

      // Should eventually resolve with data
      waitFor(() => {
        expect(result.current).toBe('data');
      });
    });
  });
});