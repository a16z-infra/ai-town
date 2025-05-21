// Removed Convex imports: import { ObjectType, v } from 'convex/values';
// Removed Convex server imports.
import { GameId, parseGameId, ConversationId, PlayerId as PlayerIdType, OperationId } from './ids'; // Adjusted PlayerId import

// SerializedAgent interface based on the original serializedAgent object
export interface SerializedAgent {
  id: GameId<'agents'>; // Assuming id is already in the correct GameId format from DB/source
  playerId: PlayerIdType; // Assuming playerId is in PlayerIdType format
  toRemember?: ConversationId;
  lastConversation?: number;
  lastInviteAttempt?: number;
  inProgressOperation?: {
    name: string;
    operationId: OperationId; // Assuming it's an OperationId string
    started: number;
  };
}

export class Agent {
  id: GameId<'agents'>;
  playerId: GameId<'players'>;
  toRemember?: GameId<'conversations'>;
  lastConversation?: number;
  lastInviteAttempt?: number;
  inProgressOperation?: {
    name: string;
    operationId: GameId<'operations'>; // Changed to GameId<'operations'> for consistency
    started: number;
  };

  constructor(serialized: SerializedAgent) {
    const { id, playerId, toRemember, lastConversation, lastInviteAttempt, inProgressOperation } = serialized;
    
    this.id = parseGameId('agents', id);
    this.playerId = parseGameId('players', playerId); // PlayerId from serialized is PlayerIdType
    
    this.toRemember =
      toRemember !== undefined
        ? parseGameId('conversations', toRemember)
        : undefined;
    this.lastConversation = lastConversation;
    this.lastInviteAttempt = lastInviteAttempt;
    
    if (inProgressOperation) {
      this.inProgressOperation = {
        name: inProgressOperation.name,
        // Assuming operationId in SerializedAgent is a string that needs parsing
        operationId: parseGameId('operations', inProgressOperation.operationId as string), 
        started: inProgressOperation.started,
      };
    } else {
      this.inProgressOperation = undefined;
    }
  }

  serialize(): SerializedAgent {
    return {
      id: this.id,
      playerId: this.playerId, // This is GameId<'players'>, compatible with PlayerIdType
      toRemember: this.toRemember,
      lastConversation: this.lastConversation,
      lastInviteAttempt: this.lastInviteAttempt,
      // Ensure inProgressOperation.operationId is correctly serialized if it was parsed
      inProgressOperation: this.inProgressOperation ? {
          name: this.inProgressOperation.name,
          operationId: this.inProgressOperation.operationId, // This is GameId<'operations'>
          started: this.inProgressOperation.started,
      } : undefined,
    };
  }

  // Removed tick(), startOperation(), and other game logic methods.
  // The Agent class on the client-side primarily serves as a data container.
}

// Removed Convex-specific variables and functions:
// - serializedAgent (object with v.values)
// - AgentOperations type
// - runAgentOperation function
// - agentSendMessage mutation
// - findConversationCandidate query
// Constants like ACTION_TIMEOUT etc. are not needed here as tick() is removed.
// If any constants are purely for data interpretation and not logic, they could be kept or moved.
// For now, assuming they are tied to the removed logic.
