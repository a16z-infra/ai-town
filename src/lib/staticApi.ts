/**
 * Static API replacement for Convex functions
 * Provides the same interface as the original API but with static/local data
 */

import { staticDb, WorldStatus, World } from '../lib/staticDb';

export const staticApi = {
  world: {
    // Replace api.world.defaultWorldStatus
    defaultWorldStatus: async () => {
      const worldStatus = await staticDb.query<WorldStatus>('worldStatus')
        .filter((ws) => ws.isDefault === true)
        .unique();
      
      return worldStatus;
    },

    // Replace api.world.worldState  
    worldState: async ({ worldId }: { worldId: string }) => {
      const world = await staticDb.get<World>(worldId);
      
      if (!world) return null;

      // Return a minimal world state for the game
      return {
        world: world,
        engine: {
          _id: `engine:${Date.now()}`,
          currentTime: Date.now(),
          generationNumber: 1,
          status: 'running' as const
        },
        players: [],
        agents: [],
        conversations: [],
      };
    },

    // Replace api.world.gameDescriptions
    gameDescriptions: async ({ worldId }: { worldId: string }) => {
      // Return static game descriptions for now
      return {
        worldId,
        descriptions: []
      };
    },

    // Replace api.world.heartbeatWorld
    heartbeatWorld: async ({ worldId }: { worldId: string }) => {
      // Update the lastViewed timestamp
      const worldStatus = await staticDb.query<WorldStatus>('worldStatus')
        .filter((ws) => ws.worldId === worldId)
        .unique();
      
      if (worldStatus) {
        await staticDb.patch(worldStatus._id, {
          lastViewed: Date.now()
        });
      }
      
      return { success: true };
    },

    // Replace api.world.sendWorldInput
    sendWorldInput: async ({ engineId, name, args }: { 
      engineId: string; 
      name: string; 
      args: any 
    }) => {
      // Generate a mock input ID
      const inputId = `input:${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // For static version, we'll just log the input for now
      console.log('World input:', { engineId, name, args, inputId });
      
      return inputId;
    }
  },

  aiTown: {
    main: {
      // Replace api.aiTown.main.inputStatus
      inputStatus: async ({ inputId }: { inputId: string }) => {
        // For static version, assume inputs are always processed quickly
        return {
          kind: 'processed' as const,
          inputId,
          result: null
        };
      }
    }
  },

  messages: {
    // Replace api.messages.writeMessage
    writeMessage: async ({ 
      conversationId, 
      messageUuid, 
      author, 
      text, 
      worldId 
    }: { 
      conversationId: string;
      messageUuid: string;
      author: string;
      text: string;
      worldId?: string;
    }) => {
      const messageId = await staticDb.insert('messages', {
        conversationId,
        messageUuid,
        author,
        text,
        worldId
      });
      
      return messageId;
    }
  },

  music: {
    // Replace api.music.getBackgroundMusic
    getBackgroundMusic: async () => {
      // Return null for now - music can be added later
      return null;
    }
  }
};

// Export individual functions to match the usage pattern
export const world = staticApi.world;
export const aiTown = staticApi.aiTown;
export const messages = staticApi.messages;
export const music = staticApi.music;