// Removed Convex imports and game logic specific constants/functions.
import { GameId, parseGameId, PlayerId as PlayerIdType, ConversationId as ConversationIdType } from './ids';
import { parseMap, serializeMap } from './objectUtils'; // For handling Map serialization

// --- ConversationMembership ---
// Interface for serialized ConversationMembership
export interface SerializedConversationMembership {
  playerId: PlayerIdType; // Expecting pre-formatted string like "p:1"
  status: 
    | { kind: 'invited' }
    | { kind: 'walkingOver' }
    | { kind: 'participating'; started: number };
  invited: number; // Timestamp of invitation
}

// ConversationMembership class (simplified for client-side data holding)
export class ConversationMembership {
  playerId: GameId<'players'>;
  status: 
    | { kind: 'invited' }
    | { kind: 'walkingOver' }
    | { kind: 'participating'; started: number };
  invited: number;

  constructor(serialized: SerializedConversationMembership) {
    this.playerId = parseGameId('players', serialized.playerId);
    this.status = serialized.status;
    this.invited = serialized.invited;
  }

  serialize(): SerializedConversationMembership {
    return {
      playerId: this.playerId, // GameId<'players'> is compatible with PlayerIdType
      status: this.status,
      invited: this.invited,
    };
  }
}

// --- Conversation ---
// Interface for isTyping data
export interface IsTypingData {
  playerId: PlayerIdType;
  messageUuid: string;
  since: number;
}

// Interface for lastMessage data
export interface LastMessageData {
  author: PlayerIdType;
  timestamp: number;
}

// Interface for SerializedConversation
export interface SerializedConversation {
  id: ConversationIdType; // Expecting pre-formatted string like "c:1"
  creator: PlayerIdType;
  created: number;
  isTyping?: IsTypingData;
  lastMessage?: LastMessageData;
  numMessages: number;
  participants: SerializedConversationMembership[]; // Array of serialized memberships
}

export class Conversation {
  id: GameId<'conversations'>;
  creator: GameId<'players'>;
  created: number;
  isTyping?: {
    playerId: GameId<'players'>;
    messageUuid: string;
    since: number;
  };
  lastMessage?: {
    author: GameId<'players'>;
    timestamp: number;
  };
  numMessages: number;
  participants: Map<GameId<'players'>, ConversationMembership>;

  constructor(serialized: SerializedConversation) {
    const { id, creator, created, isTyping, lastMessage, numMessages, participants } = serialized;
    this.id = parseGameId('conversations', id);
    this.creator = parseGameId('players', creator);
    this.created = created;
    
    this.isTyping = isTyping && {
      playerId: parseGameId('players', isTyping.playerId),
      messageUuid: isTyping.messageUuid,
      since: isTyping.since,
    };
    
    this.lastMessage = lastMessage && {
      author: parseGameId('players', lastMessage.author),
      timestamp: lastMessage.timestamp,
    };
    
    this.numMessages = numMessages;
    // Use parseMap to convert the array of serialized memberships into a Map
    this.participants = parseMap(participants, ConversationMembership, (m) => m.playerId);
  }

  serialize(): SerializedConversation {
    const { id, creator, created, isTyping, lastMessage, numMessages } = this;
    return {
      id,
      creator,
      created,
      isTyping: isTyping && { // Ensure isTyping fields are compatible
          playerId: isTyping.playerId,
          messageUuid: isTyping.messageUuid,
          since: isTyping.since,
      },
      lastMessage: lastMessage && { // Ensure lastMessage fields are compatible
          author: lastMessage.author,
          timestamp: lastMessage.timestamp,
      },
      numMessages,
      // Use serializeMap to convert the Map of ConversationMembership back to an array
      participants: serializeMap(this.participants).map(m => m.serialize()),
    };
  }

  // Removed tick, start, setIsTyping, acceptInvite, rejectInvite, stop, leave methods.
}

// Removed conversationInputs object and related input handlers.
// Removed constants not directly related to data structure (e.g. TYPING_TIMEOUT).
