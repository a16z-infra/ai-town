// Removed: import { ObjectType, v } from 'convex/values';
import { GameId, parseGameId, AgentId as AgentIdType } from './ids'; // Renamed AgentId to avoid conflict

// SerializedAgentDescription now an interface, using 'name' and 'description'
export interface SerializedAgentDescription {
  agentId: AgentIdType; // Use the imported type
  name: string; // Corresponds to 'plan' in original, now 'name' in db.ts
  description: string; // Corresponds to 'identity' in original, now 'description' in db.ts
}

export class AgentDescription {
  agentId: GameId<'agents'>;
  name: string; // Was 'plan'
  description: string; // Was 'identity'

  constructor(serialized: SerializedAgentDescription) {
    const { agentId, name, description } = serialized;
    // Assuming serialized.agentId is a string in the correct GameId format like "a:1"
    this.agentId = parseGameId('agents', agentId);
    this.name = name;
    this.description = description;
  }

  serialize(): SerializedAgentDescription {
    const { agentId, name, description } = this;
    return {
      agentId, // This is GameId<'agents'>, compatible with AgentIdType
      name,
      description,
    };
  }
}
