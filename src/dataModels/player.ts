// Removed Convex imports: import { Infer, ObjectType, v } from 'convex/values';
// Removed Convex server imports and game logic specific constants/functions.
import { GameId, parseGameId, PlayerId as PlayerIdType } from './ids';
import { Point, Vector, Path } from './types'; // Assuming types.ts is in the same directory

// Pathfinding interface based on original v.object definition
export interface Pathfinding {
  destination: Point;
  started: number;
  state:
    | { kind: 'needsPath' }
    | { kind: 'waiting'; until: number }
    | { kind: 'moving'; path: Path };
}

// Activity interface based on original v.object definition
export interface Activity {
  description: string;
  emoji?: string;
  until: number;
}

// SerializedPlayer interface based on the original serializedPlayer object
export interface SerializedPlayer {
  id: PlayerIdType; // Expecting pre-formatted string like "p:1"
  human?: string; // Typically a tokenIdentifier or similar unique string for human players
  pathfinding?: Pathfinding;
  activity?: Activity;
  lastInput: number;
  position: Point;
  facing: Vector; // Note: original convex/util/types.ts used dx, dy for Vector
  speed: number;
}

export class Player {
  id: GameId<'players'>;
  human?: string;
  pathfinding?: Pathfinding;
  activity?: Activity;
  lastInput: number;
  position: Point;
  facing: Vector;
  speed: number;

  constructor(serialized: SerializedPlayer) {
    const { id, human, pathfinding, activity, lastInput, position, facing, speed } = serialized;
    this.id = parseGameId('players', id);
    this.human = human;
    this.pathfinding = pathfinding;
    this.activity = activity;
    this.lastInput = lastInput;
    this.position = position;
    this.facing = facing; // Ensure this matches Vector type {dx, dy} or {x, y}
    this.speed = speed;
  }

  serialize(): SerializedPlayer {
    const { id, human, pathfinding, activity, lastInput, position, facing, speed } = this;
    return {
      id, // This is GameId<'players'>, compatible with PlayerIdType
      human,
      pathfinding,
      activity,
      lastInput,
      position,
      facing,
      speed,
    };
  }

  // Removed tick, tickPathfinding, tickPosition, join, leave, and other game logic methods.
  // The Player class on the client-side primarily serves as a data container.
}

// Removed playerInputs object and related input handlers.
// Removed constants not directly related to data structure (e.g. PATHFINDING_TIMEOUT).
// If characters data is needed on client, it should be loaded/managed separately, not via static import here.
// import { characters } from '../../data/characters';
// import { PlayerDescription } from './playerDescription'; // This was for Player.join logic.
// If PlayerDescription needs to be associated with a Player object, it should be done externally.
