import { Game } from '../engine/game';
import { Doc, Id } from '../_generated/dataModel';
import { Players, leaveGame } from './players';
import { DatabaseWriter } from '../_generated/server';
import { Locations } from './locations';
import { blocked, findRoute, movePlayer, stopPlayer } from './movement';
import { distance, normalize, pathPosition, pointsEqual, vector } from '../util/geometry';
import {
  CONVERSATION_DISTANCE,
  HUMAN_IDLE_TOO_LONG,
  PATHFINDING_BACKOFF,
  PATHFINDING_TIMEOUT,
  TYPING_TIMEOUT,
} from '../constants';
import { Conversations } from './conversations';
import { ConversationMembers } from './conversationMembers';
import { Agents, tickAgent } from './agents';
import { InputNames, InputArgs, inputs } from './inputs';
import { Point } from '../util/types';

export class AiTown extends Game {
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

  async handleInput<Name extends InputNames>(now: number, name: Name, args: InputArgs<Name>) {
    // TODO: figure out how to type this properly.
    const handler = inputs[name]?.handler;
    if (!handler) {
      throw new Error(`Invalid input: ${name}`);
    }
    return await handler(this, now, args as any);
  }

  tick(now: number) {
    for (const player of this.players.allDocuments()) {
      this.tickPlayer(now, player);
    }
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

  tickPlayer(now: number, player: Doc<'players'>) {
    if (player.human && player.lastInput < now - HUMAN_IDLE_TOO_LONG) {
      leaveGame(this, now, player._id);
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
      stopPlayer(this, now, player._id);
    }

    // Stop pathfinding if we've timed out.
    if (pathfinding.started + PATHFINDING_TIMEOUT < now) {
      console.warn(`Timing out pathfinding for ${player._id}`);
      stopPlayer(this, now, player._id);
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
        stopPlayer(this, now, player._id);
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
    const location = this.locations.lookup(now, player.locationId);

    // There's nothing to do if we're not moving.
    if (!player.pathfinding || player.pathfinding.state.kind !== 'moving') {
      location.velocity = 0;
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

    const [member1, member2] = members;
    const player1 = this.players.lookup(member1.playerId);
    const location1 = this.locations.lookup(now, player1.locationId);
    const position1 = { x: location1.x, y: location1.y };

    const player2 = this.players.lookup(member2.playerId);
    const location2 = this.locations.lookup(now, player2.locationId);
    const position2 = { x: location2.x, y: location2.y };

    const playerDistance = distance(position1, position2);

    // If the players are both in the "walkingOver" state and they're sufficiently close, transition both
    // of them to "participating" and stop their paths.
    if (member1.status.kind === 'walkingOver' && member2.status.kind === 'walkingOver') {
      if (playerDistance < CONVERSATION_DISTANCE) {
        console.log(`Starting conversation between ${player1._id} and ${player2._id}`);

        // First, stop the two players from moving.
        stopPlayer(this, now, player1._id);
        stopPlayer(this, now, player2._id);

        member1.status = { kind: 'participating', started: now };
        member2.status = { kind: 'participating', started: now };

        // Try to move the first player to grid point nearest the other player.
        const neighbors = (p: Point) => [
          { x: p.x + 1, y: p.y },
          { x: p.x - 1, y: p.y },
          { x: p.x, y: p.y + 1 },
          { x: p.x, y: p.y - 1 },
        ];
        const floorPos1 = { x: Math.floor(position1.x), y: Math.floor(position1.y) };
        const p1Candidates = neighbors(floorPos1).filter(
          (p) => !blocked(this, now, p, player1._id),
        );
        p1Candidates.sort((a, b) => distance(a, position2) - distance(b, position2));
        if (p1Candidates.length > 0) {
          const p1Candidate = p1Candidates[0];

          // Try to move the second player to the grid point nearest the first player's
          // destination.
          const p2Candidates = neighbors(p1Candidate).filter(
            (p) => !blocked(this, now, p, player2._id),
          );
          p2Candidates.sort((a, b) => distance(a, position2) - distance(b, position2));
          if (p2Candidates.length > 0) {
            const p2Candidate = p2Candidates[0];
            movePlayer(this, now, player1._id, p1Candidate, true);
            movePlayer(this, now, player2._id, p2Candidate, true);
          }
        }
      }
    }

    // Orient the two players towards each other if they're not moving.
    if (member1.status.kind === 'participating' && member2.status.kind === 'participating') {
      const v = normalize(vector(location1, location2));
      if (!player1.pathfinding && v) {
        location1.dx = v.dx;
        location1.dy = v.dy;
      }
      if (!player2.pathfinding && v) {
        location2.dx = -v.dx;
        location2.dy = -v.dy;
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
