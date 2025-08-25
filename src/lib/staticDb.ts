/**
 * Static Database Layer - Browser-only replacement for Convex
 * Uses DuckDB-WASM, PGLite, and in-memory storage for a serverless experience
 */

import * as duckdb from '@duckdb/duckdb-wasm';

// Global database instance
let db: duckdb.AsyncDuckDB | null = null;
let connection: duckdb.AsyncDuckDBConnection | null = null;

// Initialize the static database
export async function initializeStaticDb() {
  if (db) return { db, connection };

  try {
    // Initialize DuckDB-WASM
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
    const worker = new Worker(bundle.mainWorker!);
    const logger = new duckdb.ConsoleLogger();
    db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule);
    
    connection = await db.connect();
    
    console.log('Static database initialized successfully');
    return { db, connection };
  } catch (error) {
    console.error('Failed to initialize static database:', error);
    throw error;
  }
}

// Schema types matching the original Convex schema
export interface World {
  _id: string;
  nextId: number;
  agents: string[];
  conversations: string[];
  players: string[];
}

export interface WorldStatus {
  _id: string;
  engineId: string;
  isDefault: boolean;
  lastViewed: number;
  status: 'running' | 'stopped';
  worldId: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  messageUuid: string;
  author: string;
  text: string;
  worldId?: string;
}

// In-memory storage for development
const memoryStorage: {
  worlds: Map<string, World>;
  worldStatus: Map<string, WorldStatus>;
  messages: Map<string, Message>;
} = {
  worlds: new Map(),
  worldStatus: new Map(),
  messages: new Map(),
};

// Simple query interface similar to Convex
export class StaticQuery<T> {
  private tableName: string;
  private filters: Array<(item: T) => boolean> = [];

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  filter(predicate: (item: T) => boolean) {
    this.filters.push(predicate);
    return this;
  }

  unique(): T | null {
    const results = this.collect();
    return results.length > 0 ? results[0] : null;
  }

  collect(): T[] {
    const storage = this.getStorage<T>();
    const items = Array.from(storage.values());
    
    return items.filter(item => 
      this.filters.every(filter => filter(item))
    );
  }

  private getStorage<T>(): Map<string, T> {
    switch (this.tableName) {
      case 'worlds':
        return memoryStorage.worlds as Map<string, T>;
      case 'worldStatus':
        return memoryStorage.worldStatus as Map<string, T>;
      case 'messages':
        return memoryStorage.messages as Map<string, T>;
      default:
        throw new Error(`Unknown table: ${this.tableName}`);
    }
  }
}

// Database interface similar to Convex
export class StaticDatabase {
  query<T>(tableName: string): StaticQuery<T> {
    return new StaticQuery<T>(tableName);
  }

  async get<T>(id: string): Promise<T | null> {
    // Extract table name from ID format (assuming format like "worlds:abc123")
    const [tableName] = id.split(':');
    const storage = this.getStorageByName<T>(tableName);
    return storage.get(id) || null;
  }

  async insert<T extends { _id?: string }>(tableName: string, data: Omit<T, '_id'>): Promise<string> {
    const id = `${tableName}:${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const item = { ...data, _id: id } as T;
    
    const storage = this.getStorageByName<T>(tableName);
    storage.set(id, item);
    
    return id;
  }

  async patch<T>(id: string, updates: Partial<T>): Promise<void> {
    const [tableName] = id.split(':');
    const storage = this.getStorageByName<T>(tableName);
    const existing = storage.get(id);
    
    if (existing) {
      storage.set(id, { ...existing, ...updates });
    }
  }

  private getStorageByName<T>(tableName: string): Map<string, T> {
    switch (tableName) {
      case 'worlds':
        return memoryStorage.worlds as Map<string, T>;
      case 'worldStatus':
        return memoryStorage.worldStatus as Map<string, T>;
      case 'messages':
        return memoryStorage.messages as Map<string, T>;
      default:
        throw new Error(`Unknown table: ${tableName}`);
    }
  }
}

// Global database instance
export const staticDb = new StaticDatabase();

// Initialize default data
export async function initializeDefaultData() {
  // Create default world
  const defaultWorldId = await staticDb.insert('worlds', {
    nextId: 0,
    agents: [],
    conversations: [],
    players: [],
  });

  // Create default world status
  const engineId = `engine:${Date.now()}_default`;
  await staticDb.insert('worldStatus', {
    engineId,
    isDefault: true,
    lastViewed: Date.now(),
    status: 'running' as const,
    worldId: defaultWorldId,
  });

  console.log('Default data initialized');
  return { worldId: defaultWorldId, engineId };
}