import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initializeStaticDb, staticDb, initializeDefaultData } from '../lib/staticDb';

// Context for static data management
interface StaticDataContextType {
  db: typeof staticDb;
  isReady: boolean;
  error: string | null;
}

const StaticDataContext = createContext<StaticDataContextType | null>(null);

// Hook to use static data context
export function useStaticData() {
  const context = useContext(StaticDataContext);
  if (!context) {
    throw new Error('useStaticData must be used within StaticDataProvider');
  }
  return context;
}

// Hook to replace useQuery from Convex
export function useStaticQuery<T>(
  queryFn: (db: typeof staticDb) => Promise<T | null>,
  dependencies: any[] = []
): T | null {
  const [data, setData] = useState<T | null>(null);
  const { db, isReady } = useStaticData();

  useEffect(() => {
    if (!isReady) return;

    let isCancelled = false;
    
    const fetchData = async () => {
      try {
        const result = await queryFn(db);
        if (!isCancelled) {
          setData(result);
        }
      } catch (error) {
        console.error('Static query error:', error);
        if (!isCancelled) {
          setData(null);
        }
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [isReady, ...dependencies]);

  return data;
}

// Hook to replace useMutation from Convex
export function useStaticMutation<TArgs, TResult>(
  mutationFn: (db: typeof staticDb, args: TArgs) => Promise<TResult>
) {
  const { db } = useStaticData();

  return async (args: TArgs): Promise<TResult> => {
    return await mutationFn(db, args);
  };
}

// Provider component
interface StaticDataProviderProps {
  children: ReactNode;
}

export default function StaticDataProvider({ children }: StaticDataProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize the database
        await initializeStaticDb();
        
        // Set up default data
        await initializeDefaultData();
        
        setIsReady(true);
      } catch (err) {
        console.error('Failed to initialize static data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    initialize();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black text-white">
        <div className="max-w-2xl p-8 text-center">
          <h1 className="text-4xl font-bold mb-6 text-red-400">⚠️ Initialization Error</h1>
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Failed to Initialize Static Database</h2>
            <p className="text-gray-300 mb-4">
              The application encountered an error while setting up the local database:
            </p>
            <pre className="text-left text-red-300 bg-gray-900 p-4 rounded">
              {error}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold">Initializing Static Database...</h2>
          <p className="text-gray-300 mt-2">Setting up your local AI Town instance</p>
        </div>
      </div>
    );
  }

  return (
    <StaticDataContext.Provider value={{ db: staticDb, isReady, error }}>
      {children}
    </StaticDataContext.Provider>
  );
}