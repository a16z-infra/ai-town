/**
 * Static hooks to replace Convex React hooks
 * Provides the same interface but works with static data
 */

import React from 'react';
import { useStaticQuery, useStaticMutation } from '../components/StaticDataProvider';
import { staticApi } from '../lib/staticApi';

// Replace useQuery from Convex
export function useQuery<T>(
  queryFn: (args?: any) => Promise<T>,
  args?: any
): T | undefined {
  // Handle the 'skip' case
  if (args === 'skip') {
    return undefined;
  }

  const result = useStaticQuery(
    async () => {
      try {
        return await queryFn(args);
      } catch (error) {
        console.error('Query error:', error);
        return null;
      }
    },
    args ? [JSON.stringify(args)] : []
  );

  return result || undefined;
}

// Replace useMutation from Convex
export function useMutation<TArgs, TResult>(
  mutationFn: (args: TArgs) => Promise<TResult>
) {
  return useStaticMutation(async (_, args: TArgs) => {
    return await mutationFn(args);
  });
}

// Replace useConvex from Convex
export function useConvex() {
  return {
    watchQuery: async (queryFn: Function, args: any) => {
      // For static version, just return the result immediately
      const result = await queryFn(args);
      return result;
    },
    mutation: async (mutationFn: Function, args: any) => {
      return await mutationFn(args);
    }
  };
}

// Create an api object that matches the original structure
export const api = {
  world: {
    defaultWorldStatus: () => staticApi.world.defaultWorldStatus(),
    worldState: (args: { worldId: string }) => staticApi.world.worldState(args),
    gameDescriptions: (args: { worldId: string }) => staticApi.world.gameDescriptions(args),
    heartbeatWorld: (args: { worldId: string }) => staticApi.world.heartbeatWorld(args),
    sendWorldInput: (args: { engineId: string; name: string; args: any }) => 
      staticApi.world.sendWorldInput(args),
  },
  aiTown: {
    main: {
      inputStatus: (args: { inputId: string }) => staticApi.aiTown.main.inputStatus(args),
    }
  },
  messages: {
    writeMessage: (args: { 
      conversationId: string;
      messageUuid: string;
      author: string;
      text: string;
      worldId?: string;
    }) => staticApi.messages.writeMessage(args),
  },
  music: {
    getBackgroundMusic: () => staticApi.music.getBackgroundMusic(),
  }
};

// Re-export ConvexProvider as a no-op for compatibility
export function ConvexProvider({ children, client }: { children: React.ReactNode; client?: any }) {
  return <>{children}</>;
}