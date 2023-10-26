import { Infer, v } from 'convex/values';
import { Point, Vector, path, point, vector } from '../util/types';
import { GameId, parseGameId } from './ids';
import { playerId } from './ids';
import {
  PATHFINDING_TIMEOUT,
  PATHFINDING_BACKOFF,
  HUMAN_IDLE_TOO_LONG,
  MAX_HUMAN_PLAYERS,
} from '../constants';
import { pointsEqual, pathPosition } from '../util/geometry';
import { Game } from './game';
import { stopPlayer, findRoute, blocked, movePlayer } from './movement';
import { inputHandler } from './inputHandler';
import { stopConversation } from './conversation';
import { characters } from '../../data/characters';

const pathfinding = v.object({
  destination: point,
  started: v.number(),
  state: v.union(
    v.object({
      kind: v.literal('needsPath'),
    }),
    v.object({
      kind: v.literal('waiting'),
      until: v.number(),
    }),
    v.object({
      kind: v.literal('moving'),
      path,
    }),
  ),
});
export type Pathfinding = Infer<typeof pathfinding>;

export const activity = v.object({
  description: v.string(),
  emoji: v.optional(v.string()),
  until: v.number(),
});
export type Activity = Infer<typeof activity>;

export const playerFields = {
  id: playerId,
  human: v.optional(v.string()),
  pathfinding: v.optional(pathfinding),
  activity: v.optional(activity),

  // The last time they did something.
  lastInput: v.number(),

  position: point,
  facing: vector,
  speed: v.number(),
};
export const player = v.object(playerFields);
export type PlayerDoc = Infer<typeof player>;
export type Player = {
  id: GameId<'players'>;
  human?: string;
  pathfinding?: Pathfinding;
  activity?: Activity;

  lastInput: number;

  position: Point;
  facing: Vector;
  speed: number;
};

export const playerDescriptionFields = {
  playerId,
  name: v.string(),
  description: v.string(),
  character: v.string(),
};
const playerDescription = v.object(playerDescriptionFields);
type PlayerDescriptionDoc = Infer<typeof playerDescription>;
export type PlayerDescription = {
  playerId: GameId<'players'>;
  name: string;
  description: string;
  character: string;
};

function parsePlayer(player: PlayerDoc, nextId: number): Player {
  const { id, human, lastInput, pathfinding, activity, position, facing, speed } = player;
  return {
    id: parseGameId('players', id, nextId),
    human,
    lastInput,
    pathfinding,
    activity,
    position,
    facing,
    speed,
  };
}

export function parsePlayers(players: PlayerDoc[], nextId: number): Map<GameId<'players'>, Player> {
  const result: Map<GameId<'players'>, Player> = new Map();
  for (const player of players) {
    const parsed = parsePlayer(player, nextId);
    if (result.has(parsed.id)) {
      throw new Error(`Duplicate player ID: ${parsed.id}`);
    }
    result.set(parsed.id, parsed);
  }
  return result;
}

export function parsePlayerDescriptions(
  players: Map<GameId<'players'>, Player>,
  descriptions: PlayerDescriptionDoc[],
  nextId: number,
): Map<GameId<'players'>, PlayerDescription> {
  const result: Map<GameId<'players'>, PlayerDescription> = new Map();
  for (const description of descriptions) {
    const { playerId } = description;
    const id = parseGameId('players', playerId, nextId);
    if (!players.has(id)) {
      throw new Error(`Invalid player ID ${id}`);
    }
    if (result.has(id)) {
      throw new Error(`Duplicate player description for ${id}`);
    }
    result.set(id, {
      playerId: id,
      name: description.name,
      description: description.description,
      character: description.character,
    });
  }
  return result;
}

export function tickPlayer(game: Game, now: number, player: Player) {
  if (player.human && player.lastInput < now - HUMAN_IDLE_TOO_LONG) {
    leaveGame(game, now, player);
  }
}

export function tickPathfinding(game: Game, now: number, player: Player) {
  // There's nothing to do if we're not moving.
  const { pathfinding, position } = player;
  if (!pathfinding) {
    return;
  }

  // Stop pathfinding if we've reached our destination.
  if (pathfinding.state.kind === 'moving' && pointsEqual(pathfinding.destination, position)) {
    stopPlayer(player);
  }

  // Stop pathfinding if we've timed out.
  if (pathfinding.started + PATHFINDING_TIMEOUT < now) {
    console.warn(`Timing out pathfinding for ${player.id}`);
    stopPlayer(player);
  }

  // Transition from "waiting" to "needsPath" if we're past the deadline.
  if (pathfinding.state.kind === 'waiting' && pathfinding.state.until < now) {
    pathfinding.state = { kind: 'needsPath' };
  }

  // Perform pathfinding if needed.
  if (pathfinding.state.kind === 'needsPath') {
    const route = findRoute(game, now, player, pathfinding.destination);
    if (route === null) {
      console.log(`Failed to route to ${JSON.stringify(pathfinding.destination)}`);
      stopPlayer(player);
    } else {
      if (route.newDestination) {
        console.warn(
          `Updating destination from ${JSON.stringify(pathfinding.destination)} to ${JSON.stringify(
            route.newDestination,
          )}`,
        );
        pathfinding.destination = route.newDestination;
      }
      pathfinding.state = { kind: 'moving', path: route.path };
    }
  }
}

export function tickPosition(game: Game, now: number, player: Player) {
  // There's nothing to do if we're not moving.
  if (!player.pathfinding || player.pathfinding.state.kind !== 'moving') {
    player.speed = 0;
    return;
  }

  // Compute a candidate new position and check if it collides
  // with anything.
  const candidate = pathPosition(player.pathfinding.state.path as any, now);
  if (!candidate) {
    console.warn(`Path out of range of ${now} for ${player.id}`);
    return;
  }
  const { position, facing, velocity } = candidate;
  const collisionReason = blocked(game, now, position, player.id);
  if (collisionReason !== null) {
    const backoff = Math.random() * PATHFINDING_BACKOFF;
    console.warn(`Stopping path for ${player.id}, waiting for ${backoff}ms: ${collisionReason}`);
    player.pathfinding.state = {
      kind: 'waiting',
      until: now + backoff,
    };
    return;
  }
  // Update the player's location.
  player.position = position;
  player.facing = facing;
  player.speed = velocity;
}

export function joinGame(
  game: Game,
  now: number,
  name: string,
  character: string,
  description: string,
  tokenIdentifier?: string,
) {
  if (tokenIdentifier) {
    let numHumans = 0;
    for (const player of game.players.values()) {
      if (player.human) {
        numHumans++;
      }
      if (player.human === tokenIdentifier) {
        throw new Error(`You are already in this game!`);
      }
    }
    if (numHumans >= MAX_HUMAN_PLAYERS) {
      throw new Error(`Only ${MAX_HUMAN_PLAYERS} human players allowed at once.`);
    }
  }
  let position;
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = {
      x: Math.floor(Math.random() * game.worldMap.width),
      y: Math.floor(Math.random() * game.worldMap.height),
    };
    if (blocked(game, now, candidate)) {
      continue;
    }
    position = candidate;
    break;
  }
  if (!position) {
    throw new Error(`Failed to find a free position!`);
  }
  const facingOptions = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];
  const facing = facingOptions[Math.floor(Math.random() * facingOptions.length)];
  if (!characters.find((c) => c.name === character)) {
    throw new Error(`Invalid character: ${character}`);
  }
  const playerId = game.allocId('players');
  game.players.set(playerId, {
    id: playerId,
    human: tokenIdentifier,
    lastInput: now,
    position,
    facing,
    speed: 0,
  });
  game.playerDescriptions.set(playerId, {
    playerId,
    character,
    description,
    name,
  });
  game.descriptionsModified = true;
  return playerId;
}

function leaveGame(game: Game, now: number, player: Player) {
  // Stop our conversation if we're leaving the game.
  const conversation = [...game.conversations.values()].find((c) => c.participants.has(player.id));
  if (conversation) {
    stopConversation(game, now, conversation);
  }
  game.players.delete(player.id);
}

export const playerInputs = {
  join: inputHandler({
    args: {
      name: v.string(),
      character: v.string(),
      description: v.string(),
      tokenIdentifier: v.optional(v.string()),
    },
    handler: (game, now, args) => {
      joinGame(game, now, args.name, args.character, args.description, args.tokenIdentifier);
      return null;
    },
  }),
  leave: inputHandler({
    args: { playerId },
    handler: (game, now, args) => {
      const playerId = parseGameId('players', args.playerId, game.nextId);
      const player = game.players.get(playerId);
      if (!player) {
        throw new Error(`Invalid player ID ${playerId}`);
      }
      leaveGame(game, now, player);
      return null;
    },
  }),
  moveTo: inputHandler({
    args: {
      playerId,
      destination: v.union(point, v.null()),
    },
    handler: (game, now, args) => {
      const playerId = parseGameId('players', args.playerId, game.nextId);
      const player = game.players.get(playerId);
      if (!player) {
        throw new Error(`Invalid player ID ${playerId}`);
      }
      if (args.destination) {
        movePlayer(game, now, player, args.destination);
      } else {
        stopPlayer(player);
      }
      return null;
    },
  }),
};
