/**
 * World Persistence Manager using DuckDB/Parquet
 * Handles saving and loading world states, character data, and conversation history
 */

import { Agent, Conversation } from './staticAgentSimulation';
import { initializeStaticDb } from './staticDb';

export interface WorldState {
  id: string;
  name: string;
  timestamp: number;
  agents: Agent[];
  conversations: Conversation[];
  metadata: {
    totalTimeElapsed: number;
    totalConversations: number;
    userCharacters: string[];
  };
}

export class WorldPersistenceManager {
  private static instance: WorldPersistenceManager;
  private db: any;
  private connection: any;
  private initialized = false;

  static getInstance(): WorldPersistenceManager {
    if (!WorldPersistenceManager.instance) {
      WorldPersistenceManager.instance = new WorldPersistenceManager();
    }
    return WorldPersistenceManager.instance;
  }

  private constructor() {}

  async initialize() {
    if (this.initialized) return;

    try {
      const { db, connection } = await initializeStaticDb();
      this.db = db;
      this.connection = connection;
      
      await this.setupTables();
      this.initialized = true;
      console.log('World persistence initialized');
    } catch (error) {
      console.error('Failed to initialize world persistence:', error);
      // Fallback to localStorage
      this.initialized = false;
    }
  }

  private async setupTables() {
    if (!this.connection) return;

    // Create world states table
    await this.connection.query(`
      CREATE TABLE IF NOT EXISTS world_states (
        id VARCHAR PRIMARY KEY,
        name VARCHAR,
        timestamp BIGINT,
        agents JSON,
        conversations JSON,
        metadata JSON
      )
    `);

    // Create conversation history table for detailed logging
    await this.connection.query(`
      CREATE TABLE IF NOT EXISTS conversation_history (
        id VARCHAR PRIMARY KEY,
        world_state_id VARCHAR,
        participants JSON,
        messages JSON,
        start_time BIGINT,
        end_time BIGINT
      )
    `);

    // Create agent memories table
    await this.connection.query(`
      CREATE TABLE IF NOT EXISTS agent_memories (
        id VARCHAR PRIMARY KEY,
        agent_id VARCHAR,
        world_state_id VARCHAR,
        memory_text VARCHAR,
        timestamp BIGINT,
        importance_score FLOAT
      )
    `);
  }

  async saveWorldState(
    name: string,
    agents: Agent[],
    conversations: Conversation[],
    metadata?: Partial<WorldState['metadata']>
  ): Promise<string> {
    const worldState: WorldState = {
      id: `world_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      timestamp: Date.now(),
      agents: agents.map(agent => ({ ...agent })), // Deep copy
      conversations: conversations.map(conv => ({ ...conv })),
      metadata: {
        totalTimeElapsed: 0,
        totalConversations: conversations.length,
        userCharacters: agents.filter(a => a.isUserControlled).map(a => a.id),
        ...metadata
      }
    };

    try {
      if (this.initialized && this.connection) {
        // Save to DuckDB
        await this.connection.query(`
          INSERT INTO world_states (id, name, timestamp, agents, conversations, metadata)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          worldState.id,
          worldState.name,
          worldState.timestamp,
          JSON.stringify(worldState.agents),
          JSON.stringify(worldState.conversations),
          JSON.stringify(worldState.metadata)
        ]);

        // Save detailed conversation history
        for (const conv of conversations) {
          await this.connection.query(`
            INSERT INTO conversation_history (id, world_state_id, participants, messages, start_time, end_time)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            conv.id,
            worldState.id,
            JSON.stringify(conv.participants),
            JSON.stringify(conv.messages),
            conv.startTime,
            Date.now()
          ]);
        }

        // Save agent memories
        for (const agent of agents) {
          if (agent.memories) {
            for (const memory of agent.memories) {
              const memoryId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              await this.connection.query(`
                INSERT INTO agent_memories (id, agent_id, world_state_id, memory_text, timestamp, importance_score)
                VALUES (?, ?, ?, ?, ?, ?)
              `, [
                memoryId,
                agent.id,
                worldState.id,
                memory,
                Date.now(),
                0.5 // Default importance
              ]);
            }
          }
        }
      } else {
        // Fallback to localStorage
        const savedStates = this.getLocalStorageStates();
        savedStates.push(worldState);
        localStorage.setItem('aitown_world_states', JSON.stringify(savedStates));
      }

      console.log('World state saved:', worldState.id);
      return worldState.id;
    } catch (error) {
      console.error('Failed to save world state:', error);
      throw error;
    }
  }

  async loadWorldState(worldId: string): Promise<WorldState | null> {
    try {
      if (this.initialized && this.connection) {
        // Load from DuckDB
        const result = await this.connection.query(`
          SELECT * FROM world_states WHERE id = ?
        `, [worldId]);

        const row = result.toArray()[0];
        if (!row) return null;

        return {
          id: row.id,
          name: row.name,
          timestamp: row.timestamp,
          agents: JSON.parse(row.agents),
          conversations: JSON.parse(row.conversations),
          metadata: JSON.parse(row.metadata)
        };
      } else {
        // Fallback to localStorage
        const savedStates = this.getLocalStorageStates();
        return savedStates.find(state => state.id === worldId) || null;
      }
    } catch (error) {
      console.error('Failed to load world state:', error);
      return null;
    }
  }

  async listWorldStates(): Promise<Array<{ id: string; name: string; timestamp: number; agentCount: number }>> {
    try {
      if (this.initialized && this.connection) {
        // Load from DuckDB
        const result = await this.connection.query(`
          SELECT id, name, timestamp, agents FROM world_states
          ORDER BY timestamp DESC
        `);

        return result.toArray().map((row: any) => ({
          id: row.id,
          name: row.name,
          timestamp: row.timestamp,
          agentCount: JSON.parse(row.agents).length
        }));
      } else {
        // Fallback to localStorage
        const savedStates = this.getLocalStorageStates();
        return savedStates.map(state => ({
          id: state.id,
          name: state.name,
          timestamp: state.timestamp,
          agentCount: state.agents.length
        })).sort((a, b) => b.timestamp - a.timestamp);
      }
    } catch (error) {
      console.error('Failed to list world states:', error);
      return [];
    }
  }

  async deleteWorldState(worldId: string): Promise<boolean> {
    try {
      if (this.initialized && this.connection) {
        // Delete from DuckDB
        await this.connection.query(`DELETE FROM world_states WHERE id = ?`, [worldId]);
        await this.connection.query(`DELETE FROM conversation_history WHERE world_state_id = ?`, [worldId]);
        await this.connection.query(`DELETE FROM agent_memories WHERE world_state_id = ?`, [worldId]);
      } else {
        // Fallback to localStorage
        const savedStates = this.getLocalStorageStates();
        const filtered = savedStates.filter(state => state.id !== worldId);
        localStorage.setItem('aitown_world_states', JSON.stringify(filtered));
      }

      console.log('World state deleted:', worldId);
      return true;
    } catch (error) {
      console.error('Failed to delete world state:', error);
      return false;
    }
  }

  async addAgentMemory(agentId: string, memoryText: string, importanceScore = 0.5): Promise<void> {
    try {
      if (this.initialized && this.connection) {
        const memoryId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await this.connection.query(`
          INSERT INTO agent_memories (id, agent_id, world_state_id, memory_text, timestamp, importance_score)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          memoryId,
          agentId,
          'current', // Current session
          memoryText,
          Date.now(),
          importanceScore
        ]);
      }
    } catch (error) {
      console.error('Failed to add agent memory:', error);
    }
  }

  async getAgentMemories(agentId: string, limit = 10): Promise<string[]> {
    try {
      if (this.initialized && this.connection) {
        const result = await this.connection.query(`
          SELECT memory_text FROM agent_memories 
          WHERE agent_id = ? 
          ORDER BY importance_score DESC, timestamp DESC 
          LIMIT ?
        `, [agentId, limit]);

        return result.toArray().map((row: any) => row.memory_text);
      }
    } catch (error) {
      console.error('Failed to get agent memories:', error);
    }
    
    return [];
  }

  private getLocalStorageStates(): WorldState[] {
    const stored = localStorage.getItem('aitown_world_states');
    return stored ? JSON.parse(stored) : [];
  }

  async exportWorldData(): Promise<Blob> {
    const states = await this.listWorldStates();
    const fullStates = await Promise.all(
      states.map(state => this.loadWorldState(state.id))
    );

    const exportData = {
      version: '1.0',
      exportTime: Date.now(),
      worldStates: fullStates.filter(state => state !== null)
    };

    return new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
  }

  async importWorldData(file: File): Promise<number> {
    const text = await file.text();
    const data = JSON.parse(text);
    
    let imported = 0;
    if (data.worldStates && Array.isArray(data.worldStates)) {
      for (const worldState of data.worldStates) {
        try {
          await this.saveWorldState(
            `${worldState.name} (imported)`,
            worldState.agents,
            worldState.conversations,
            worldState.metadata
          );
          imported++;
        } catch (error) {
          console.error('Failed to import world state:', error);
        }
      }
    }

    return imported;
  }
}

// Export singleton instance
export const worldPersistence = WorldPersistenceManager.getInstance();