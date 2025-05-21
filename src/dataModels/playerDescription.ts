// Removed: import { ObjectType, v } from 'convex/values';
import { GameId, parseGameId, PlayerId as PlayerIdType } from './ids'; // Renamed PlayerId to PlayerIdType to avoid conflict

// SerializedPlayerDescription now an interface
export interface SerializedPlayerDescription {
  playerId: PlayerIdType; // Use the imported type
  name: string;
  description: string;
  character: string; // This field is used by the class
}

export class PlayerDescription {
  playerId: GameId<'players'>;
  name: string;
  description: string;
  character: string;

  constructor(serialized: SerializedPlayerDescription) {
    const { playerId, name, description, character } = serialized;
    // Ensure playerId is parsed into the branded type GameId<'players'>
    // The input 'playerId' from SerializedPlayerDescription is already PlayerIdType (string & { __type: "players"})
    // if it comes from a trusted source (like another part of our client-side code).
    // If it's a raw string from DB that isn't pre-parsed, parseGameId would be needed.
    // Assuming the 'playerId' field in the DB stored object (which becomes 'serialized.playerId')
    // is already a string in the correct GameId format like "p:1".
    this.playerId = parseGameId('players', playerId);
    this.name = name;
    this.description = description;
    this.character = character;
  }

  serialize(): SerializedPlayerDescription {
    const { playerId, name, description, character } = this;
    return {
      playerId, // This is GameId<'players'>, which is compatible with PlayerIdType
      name,
      description,
      character,
    };
  }
}
