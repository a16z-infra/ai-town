import { Infer, ObjectType, v } from 'convex/values';
import { Point, Vector, path, point, vector } from '../util/types';
import { GameId, parseGameId } from './ids';
import { playerId } from './ids';
import {
  PATHFINDING_TIMEOUT,
  PATHFINDING_BACKOFF,
  HUMAN_IDLE_TOO_LONG,
  MAX_HUMAN_PLAYERS,
  MAX_PATHFINDS_PER_STEP,
  HUNGER_DECAY_PER_SEC,
  ENERGY_DECAY_PER_SEC,
  SECURITY_DECAY_PER_SEC,
  SOCIAL_DECAY_PER_SEC,
  ESTEEM_DECAY_PER_SEC,
  FULFILLMENT_DECAY_PER_SEC,
} from '../constants';
import { pointsEqual, pathPosition } from '../util/geometry';
import { Game } from './game';
import { stopPlayer, findRoute, blocked, movePlayer } from './movement';
import { inputHandler } from './inputHandler';
import { characters } from '../../data/characters';
import { PlayerDescription } from './playerDescription';

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

export const serializedPlayer = {
  id: playerId,
  human: v.optional(v.string()),
  pathfinding: v.optional(pathfinding),
  activity: v.optional(activity),

  // The last time they did something.
  lastInput: v.number(),

  position: point,
  facing: vector,
  speed: v.number(),

  // Needs system — 5-layer Maslow
  needs: v.optional(v.object({
    hunger: v.number(),
    energy: v.number(),
    security: v.number(),
    social: v.number(),
    esteem: v.number(),
    fulfillment: v.number(),
  })),
  gold: v.optional(v.number()),
  homePoiId: v.optional(v.string()),
  lastWorkedAt: v.optional(v.number()),
  lastNeedsUpdate: v.optional(v.number()),
  // Inventory for gathering/trade system
  inventory: v.optional(v.object({
    wood: v.optional(v.number()),
    ore: v.optional(v.number()),
    herbs: v.optional(v.number()),
    food: v.optional(v.number()),
  })),
  // Political influence
  influence: v.optional(v.number()),
  alliances: v.optional(v.array(v.string())),
};
export type SerializedPlayer = ObjectType<typeof serializedPlayer>;

export class Player {
  id: GameId<'players'>;
  human?: string;
  pathfinding?: Pathfinding;
  activity?: Activity;

  lastInput: number;

  position: Point;
  facing: Vector;
  speed: number;

  // Needs system — 5-layer Maslow
  needs: { hunger: number; energy: number; security: number; social: number; esteem: number; fulfillment: number };
  gold: number;
  homePoiId?: string;
  lastWorkedAt?: number;
  lastNeedsUpdate: number;
  inventory: { wood: number; ore: number; herbs: number; food: number };
  influence: number;
  alliances: string[];

  constructor(serialized: SerializedPlayer) {
    const { id, human, pathfinding, activity, lastInput, position, facing, speed } = serialized;
    this.id = parseGameId('players', id);
    this.human = human;
    this.pathfinding = pathfinding;
    this.activity = activity;
    this.lastInput = lastInput;
    this.position = position;
    this.facing = facing;
    this.speed = speed;

    // Needs system
    this.needs = serialized.needs ?? { hunger: 100, energy: 100, security: 80, social: 70, esteem: 60, fulfillment: 50 };
    this.gold = serialized.gold ?? 20;
    this.homePoiId = serialized.homePoiId;
    this.lastWorkedAt = serialized.lastWorkedAt;
    this.lastNeedsUpdate = serialized.lastNeedsUpdate ?? Date.now();
    const inv = serialized.inventory;
    this.inventory = { wood: inv?.wood ?? 0, ore: inv?.ore ?? 0, herbs: inv?.herbs ?? 0, food: inv?.food ?? 0 };
    this.influence = serialized.influence ?? 0;
    this.alliances = serialized.alliances ?? [];
  }

  tick(game: Game, now: number) {
    if (this.human && this.lastInput < now - HUMAN_IDLE_TOO_LONG) {
      this.leave(game, now);
    }

    // Needs decay — only for AI agents, always runs (even during inProgressOperation)
    if (!this.human) {
      const dt = (now - this.lastNeedsUpdate) / 1000;
      if (dt > 0) {
        // Layer 1: Physiological
        this.needs.hunger = Math.max(0, this.needs.hunger - HUNGER_DECAY_PER_SEC * dt);
        this.needs.energy = Math.max(0, this.needs.energy - ENERGY_DECAY_PER_SEC * dt);
        // Layer 2: Safety
        this.needs.security = Math.max(0, this.needs.security - SECURITY_DECAY_PER_SEC * dt);
        // Layer 3: Social
        this.needs.social = Math.max(0, this.needs.social - SOCIAL_DECAY_PER_SEC * dt);
        // Layer 4: Esteem
        this.needs.esteem = Math.max(0, this.needs.esteem - ESTEEM_DECAY_PER_SEC * dt);
        // Layer 5: Self-actualization
        this.needs.fulfillment = Math.max(0, this.needs.fulfillment - FULFILLMENT_DECAY_PER_SEC * dt);
        this.lastNeedsUpdate = now;
      }
    }
  }

  tickPathfinding(game: Game, now: number) {
    // There's nothing to do if we're not moving.
    const { pathfinding, position } = this;
    if (!pathfinding) {
      return;
    }

    // Stop pathfinding if we've reached our destination.
    if (pathfinding.state.kind === 'moving' && pointsEqual(pathfinding.destination, position)) {
      stopPlayer(this);
    }

    // Stop pathfinding if we've timed out.
    if (pathfinding.started + PATHFINDING_TIMEOUT < now) {
      console.warn(`Timing out pathfinding for ${this.id}`);
      stopPlayer(this);
    }

    // Transition from "waiting" to "needsPath" if we're past the deadline.
    if (pathfinding.state.kind === 'waiting' && pathfinding.state.until < now) {
      pathfinding.state = { kind: 'needsPath' };
    }

    // Perform pathfinding if needed.
    if (pathfinding.state.kind === 'needsPath' && game.numPathfinds < MAX_PATHFINDS_PER_STEP) {
      game.numPathfinds++;
      if (game.numPathfinds === MAX_PATHFINDS_PER_STEP) {
        console.warn(`Reached max pathfinds for this step`);
      }
      const route = findRoute(game, now, this, pathfinding.destination);
      if (route === null) {
        console.log(`Failed to route to ${JSON.stringify(pathfinding.destination)}`);
        stopPlayer(this);
      } else {
        if (route.newDestination) {
          console.warn(
            `Updating destination from ${JSON.stringify(
              pathfinding.destination,
            )} to ${JSON.stringify(route.newDestination)}`,
          );
          pathfinding.destination = route.newDestination;
        }
        pathfinding.state = { kind: 'moving', path: route.path };
      }
    }
  }

  tickPosition(game: Game, now: number) {
    // There's nothing to do if we're not moving.
    if (!this.pathfinding || this.pathfinding.state.kind !== 'moving') {
      this.speed = 0;
      return;
    }

    // Compute a candidate new position and check if it collides
    // with anything.
    const candidate = pathPosition(this.pathfinding.state.path as any, now);
    if (!candidate) {
      console.warn(`Path out of range of ${now} for ${this.id}`);
      return;
    }
    const { position, facing, velocity } = candidate;
    const collisionReason = blocked(game, now, position, this.id);
    if (collisionReason !== null) {
      const backoff = Math.random() * PATHFINDING_BACKOFF;
      console.warn(`Stopping path for ${this.id}, waiting for ${backoff}ms: ${collisionReason}`);
      this.pathfinding.state = {
        kind: 'waiting',
        until: now + backoff,
      };
      return;
    }
    // Update the player's location.
    this.position = position;
    this.facing = facing;
    this.speed = velocity;
  }

  static join(
    game: Game,
    now: number,
    name: string,
    character: string,
    description: string,
    tokenIdentifier?: string,
    homePoiId?: string,
  ) {
    if (tokenIdentifier) {
      let numHumans = 0;
      for (const player of game.world.players.values()) {
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
    game.world.players.set(
      playerId,
      new Player({
        id: playerId,
        human: tokenIdentifier,
        lastInput: now,
        position,
        facing,
        speed: 0,
        homePoiId,
      }),
    );
    game.playerDescriptions.set(
      playerId,
      new PlayerDescription({
        playerId,
        character,
        description,
        name,
      }),
    );
    game.descriptionsModified = true;
    return playerId;
  }

  leave(game: Game, now: number) {
    // Stop our conversation if we're leaving the game.
    const conversation = [...game.world.conversations.values()].find((c) =>
      c.participants.has(this.id),
    );
    if (conversation) {
      conversation.stop(game, now);
    }
    game.world.players.delete(this.id);
  }

  serialize(): SerializedPlayer {
    const {
      id,
      human,
      pathfinding,
      activity,
      lastInput,
      position,
      facing,
      speed,
      needs,
      gold,
      homePoiId,
      lastWorkedAt,
      lastNeedsUpdate,
      inventory,
      influence,
      alliances,
    } = this;
    return {
      id,
      human,
      pathfinding,
      activity,
      lastInput,
      position,
      facing,
      speed,
      needs,
      gold,
      homePoiId,
      lastWorkedAt,
      lastNeedsUpdate,
      inventory,
      influence,
      alliances,
    };
  }
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
      Player.join(game, now, args.name, args.character, args.description, args.tokenIdentifier);
      return null;
    },
  }),
  leave: inputHandler({
    args: { playerId },
    handler: (game, now, args) => {
      const playerId = parseGameId('players', args.playerId);
      const player = game.world.players.get(playerId);
      if (!player) {
        throw new Error(`Invalid player ID ${playerId}`);
      }
      player.leave(game, now);
      return null;
    },
  }),
  moveTo: inputHandler({
    args: {
      playerId,
      destination: v.union(point, v.null()),
    },
    handler: (game, now, args) => {
      const playerId = parseGameId('players', args.playerId);
      const player = game.world.players.get(playerId);
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
