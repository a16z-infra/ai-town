/**
 * Minimal static replacement to get the app building
 * This bypasses complex Convex types for now
 */
import React from 'react';
import { useStaticData } from '../components/StaticDataProvider';

// Simplified types for the static version
export type Id<T extends string> = string & { __tableName: T };
export type GameId<T extends string> = string & { __gameId: T };

// Mock implementations that return actual data structures
export function useQuery<T>(queryFn: any, args?: any): T | undefined {
  const { isReady } = useStaticData();
  
  if (!isReady) return undefined;
  
  // For simplified version, immediately resolve with mock data
  const [result, setResult] = React.useState<T | undefined>(undefined);
  
  React.useEffect(() => {
    if (typeof queryFn === 'function') {
      queryFn(args).then((data: T) => setResult(data)).catch(() => setResult(undefined));
    }
  }, [queryFn, JSON.stringify(args)]);
  
  return result;
}

export function useMutation<TArgs, TResult>(mutationFn: any) {
  return async (args: TArgs): Promise<TResult> => {
    console.log('Mock mutation called:', args);
    return {} as TResult;
  };
}

export function useConvex() {
  return {
    watchQuery: async (queryFn: Function, args: any) => {
      return {};
    },
    mutation: async (mutationFn: Function, args: any) => {
      return {};
    }
  };
}

// Mock API that matches the expected interface
export const api = {
  world: {
    defaultWorldStatus: (args?: any) => Promise.resolve({
      worldId: 'world:default',
      engineId: 'engine:default',
      isDefault: true,
      lastViewed: Date.now(),
      status: 'running' as const
    }),
    worldState: (args: any) => Promise.resolve({
      world: {
        nextId: 0,
        conversations: [],
        players: [],
        agents: [],
        historicalLocations: undefined
      },
      engine: {
        _id: 'engine:default',
        _creationTime: Date.now(),
        currentTime: Date.now(),
        running: true,
        generationNumber: 1
      }
    }),
    gameDescriptions: (args: any) => Promise.resolve({
      agentDescriptions: [],
      playerDescriptions: [],
      worldMap: {
        width: 100,
        height: 100,
        tileSetUrl: '',
        tileSetDimX: 32,
        tileSetDimY: 32,
        tileDim: 32,
        bgTiles: [],
        objectTiles: [],
        animatedSprites: []
      }
    }),
    heartbeatWorld: (args: any) => Promise.resolve({ success: true }),
    sendWorldInput: (args: any) => Promise.resolve('mock-input-id'),
  },
  aiTown: {
    main: {
      inputStatus: (args: any) => Promise.resolve({ kind: 'processed', inputId: args.inputId, result: null }),
    }
  },
  messages: {
    writeMessage: (args: any) => Promise.resolve('mock-message-id'),
  },
  music: {
    getBackgroundMusic: (args?: any) => Promise.resolve(null),
  }
};

// No-op ConvexProvider
export function ConvexProvider({ children, client }: { children: React.ReactNode; client?: any }) {
  return <>{children}</>;
}