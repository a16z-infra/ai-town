import { Game } from '../engine/game';
import { Doc, Id } from '../_generated/dataModel';
import { InputArgs, InputReturnValue, Inputs, handleInput } from './inputs';
import { assertNever } from '../util/assertNever';
import { Players } from './players';
import { DatabaseWriter, MutationCtx } from '../_generated/server';
import { Locations } from './locations';
import { blocked, findRoute } from './movement';
import { characters } from '../../data/characters';
import { EPSILON, distance, normalize, pathPosition, pointsEqual, vector } from '../util/geometry';
import {
  CONVERSATION_DISTANCE,
  PATHFINDING_BACKOFF,
  PATHFINDING_TIMEOUT,
  TYPING_TIMEOUT,
} from '../constants';
import { Conversations } from './conversations';
import { ConversationMembers } from './conversationMembers';
import { Agents, tickAgent } from './agents';

export class AiTown extends Game<Inputs> {
  tickDuration = 16;
  stepDuration = 1000;
  maxTicksPerStep = 600;
  maxInputsPerStep = 32;

  constructor(
    public engineId: Id<'engines'>,
    public world: Doc<'worlds'>,
    public map: Doc<'maps'>,
    public players: Players,
    public agents: Agents,
    public locations: Locations,
    public conversations: Conversations,
    public conversationMembers: ConversationMembers,
  ) {
    super();
  }

  static async load(db: DatabaseWriter, worldId: Id<'worlds'>) {
    const world = await db.get(worldId);
    if (!world) {
      throw new Error(`Invalid world ID: ${worldId}`);
    }
    const map = await db.get(world.mapId);
    if (!map) {
      throw new Error(`Invalid map ID: ${world.mapId}`);
    }
    const { engineId } = world;
    const players = await Players.load(db, worldId);
    const agents = await Agents.load(db, players);
    const locations = await Locations.load(db, engineId, players);
    const conversations = await Conversations.load(db, worldId);
    const conversationMembers = await ConversationMembers.load(db, engineId, conversations);
    return new AiTown(
      engineId,
      world,
      map,
      players,
      agents,
      locations,
      conversations,
      conversationMembers,
    );
  }

  async handleInput(
    now: number,
    name: keyof Inputs,
    args: InputArgs<typeof name>,
  ): Promise<InputReturnValue<typeof name>> {
    return await handleInput(this, now, name, args);
  }

  tick(now: number) {
    for (const player of this.players.allDocuments()) {
      this.tickPathfinding(now, player);
    }
    for (const player of this.players.allDocuments()) {
      this.tickPosition(now, player);
    }
    for (const conversation of this.conversations.allDocuments()) {
      this.tickConversation(now, conversation);
    }
    for (const agent of this.agents.allDocuments()) {
      tickAgent(this, now, agent);
    }
  }

  tickPathfinding(now: number, player: Doc<'players'>) {
    // There's nothing to do if we're not moving.
    const { pathfinding, locationId } = player;
    if (!pathfinding) {
      return;
    }
    const location = this.locations.lookup(now, locationId);
    const position = { x: location.x, y: location.y };

    // Stop pathfinding if we've reached our destination.
    if (pathfinding.state.kind === 'moving' && pointsEqual(pathfinding.destination, position)) {
      delete player.pathfinding;
    }

    // Stop pathfinding if we've timed out.
    if (pathfinding.started + PATHFINDING_TIMEOUT < now) {
      console.warn(`Timing out pathfinding for ${player._id}`);
      delete player.pathfinding;
      location.velocity = 0;
    }

    // Transition from "waiting" to "needsPath" if we're past the deadline.
    if (pathfinding.state.kind === 'waiting' && pathfinding.state.until < now) {
      pathfinding.state = { kind: 'needsPath' };
    }

    // Perform pathfinding if needed.
    if (pathfinding.state.kind === 'needsPath') {
      const route = findRoute(this, now, player, pathfinding.destination);
      if (route === null) {
        console.log(`Failed to route to ${JSON.stringify(pathfinding.destination)}`);
        delete player.pathfinding;
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

  tickPosition(now: number, player: Doc<'players'>) {
    // There's nothing to do if we're not moving.
    if (!player.pathfinding || player.pathfinding.state.kind !== 'moving') {
      return;
    }

    // Compute a candidate new position and check if it collides
    // with anything.
    const candidate = pathPosition(player.pathfinding.state.path, now);
    if (!candidate) {
      console.warn(`Path out of range of ${now} for ${player._id}`);
      return;
    }
    const { position, facing, velocity } = candidate;
    const collisionReason = blocked(this, now, position, player._id);
    if (collisionReason !== null) {
      const backoff = Math.random() * PATHFINDING_BACKOFF;
      console.warn(`Stopping path for ${player._id}, waiting for ${backoff}ms: ${collisionReason}`);
      player.pathfinding.state = {
        kind: 'waiting',
        until: now + backoff,
      };
      return;
    }
    // Update the player's location.
    const location = this.locations.lookup(now, player.locationId);
    location.x = position.x;
    location.y = position.y;
    location.dx = facing.dx;
    location.dy = facing.dy;
    location.velocity = velocity;
  }

  tickConversation(now: number, conversation: Doc<'conversations'>) {
    if (conversation.isTyping && conversation.isTyping.since + TYPING_TIMEOUT < now) {
      delete conversation.isTyping;
    }
    const members = this.conversationMembers.filter((m) => m.conversationId === conversation._id);
    if (members.length !== 2) {
      return;
    }
    // If the players are both in the "walkingOver" state and they're sufficiently close, transition both
    // of them to "participating" and stop their paths.
    const [member1, member2] = members;
    if (member1.status.kind === 'walkingOver' && member2.status.kind === 'walkingOver') {
      const player1 = this.players.lookup(member1.playerId);
      const location1 = this.locations.lookup(now, player1.locationId);
      const position1 = { x: location1.x, y: location1.y };

      const player2 = this.players.lookup(member2.playerId);
      const location2 = this.locations.lookup(now, player2.locationId);
      const position2 = { x: location2.x, y: location2.y };

      const playerDistance = distance(position1, position2);
      if (playerDistance < CONVERSATION_DISTANCE) {
        console.log(`Starting conversation between ${player1._id} and ${player2._id}`);

        member1.status = { kind: 'participating', started: now };
        member2.status = { kind: 'participating', started: now };

        // Stop the two players from moving.
        delete player1.pathfinding;
        delete player2.pathfinding;
        location1.velocity = 0;
        location2.velocity = 0;

        // Orient the players towards each other.
        if (playerDistance > EPSILON) {
          const v = normalize(vector(location1, location2));
          if (v) {
            location1.dx = v.dx;
            location1.dy = v.dy;
            location2.dx = -v.dx;
            location2.dy = -v.dy;
          } else {
            console.warn(
              `Starting conversation between ${player1._id} and ${player2._id} who are *too* close!`,
            );
          }
        }
      }
    }
  }

  async save(): Promise<void> {
    await this.players.save();
    await this.agents.save();
    await this.locations.save();
    await this.conversations.save();
    await this.conversationMembers.save();
  }
}
