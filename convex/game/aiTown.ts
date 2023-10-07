import { Game } from '../engine/game';
import { Doc, Id } from '../_generated/dataModel';
import { InputArgs, InputReturnValue, Inputs } from './inputs';
import { assertNever } from '../util/assertNever';
import { Players } from './players';
import { DatabaseWriter } from '../_generated/server';
import { Locations } from './locations';
import { blocked, findRoute } from './movement';
import { characters } from '../../data/characters';
import { EPSILON, distance, normalize, pathPosition, pointsEqual, vector } from '../util/geometry';
import { CONVERSATION_DISTANCE, PATHFINDING_BACKOFF, PATHFINDING_TIMEOUT } from '../constants';
import { Conversations } from './conversations';
import { ConversationMembers } from './conversationMembers';

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
    const locations = await Locations.load(db, engineId, players);
    const conversations = await Conversations.load(db, worldId);
    const conversationMembers = await ConversationMembers.load(db, engineId, conversations);
    return new AiTown(engineId, world, map, players, locations, conversations, conversationMembers);
  }

  async handleInput(
    now: number,
    name: keyof Inputs,
    args: InputArgs<typeof name>,
  ): Promise<InputReturnValue<typeof name>> {
    switch (name) {
      case 'join':
        return await this.handleJoin(now, args as any);
      case 'leave':
        return await this.handleLeave(now, args as any);
      case 'moveTo':
        return await this.handleMoveTo(now, args as any);
      case 'startConversation':
        return await this.handleStartConversation(now, args as any);
      case 'acceptInvite':
        return await this.handleAcceptInvite(now, args as any);
      case 'rejectInvite':
        return await this.handleRejectInvite(now, args as any);
      case 'leaveConversation':
        return await this.handleLeaveConversation(now, args as any);
      default:
        assertNever(name);
    }
  }

  async handleJoin(
    now: number,
    { name, description, tokenIdentifier, character }: InputArgs<'join'>,
  ): Promise<InputReturnValue<'join'>> {
    const players = this.players.allDocuments();
    let position;
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = {
        x: Math.floor(Math.random() * this.map.width),
        y: Math.floor(Math.random() * this.map.height),
      };
      if (blocked(this, now, candidate)) {
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
    const locationId = await this.locations.insert(now, {
      x: position.x,
      y: position.y,
      dx: facing.dx,
      dy: facing.dy,
      velocity: 0,
    });
    const playerId = await this.players.insert({
      worldId: this.world._id,
      name,
      description,
      active: true,
      human: tokenIdentifier,
      character,
      locationId,
    });
    return playerId;
  }

  async handleLeave(
    now: number,
    { playerId }: InputArgs<'leave'>,
  ): Promise<InputReturnValue<'leave'>> {
    const player = this.players.lookup(playerId);
    // Stop our conversation if we're leaving the game.
    const membership = this.conversationMembers.find((m) => m.playerId === playerId);
    if (membership) {
      const conversation = this.conversations.find((d) => d._id === membership.conversationId);
      if (conversation === null) {
        throw new Error(`Couldn't find conversation: ${membership.conversationId}`);
      }
      this.stopConversation(now, conversation);
    }
    player.active = false;
    return null;
  }

  async handleMoveTo(
    now: number,
    { playerId, destination }: InputArgs<'moveTo'>,
  ): Promise<InputReturnValue<'moveTo'>> {
    const player = this.players.lookup(playerId);

    if (destination === null) {
      delete player.pathfinding;
      return null;
    }
    if (
      Math.floor(destination.x) !== destination.x ||
      Math.floor(destination.y) !== destination.y
    ) {
      throw new Error(`Non-integral destination: ${JSON.stringify(destination)}`);
    }
    const { x, y } = this.locations.lookup(now, player.locationId);
    const position = { x, y };
    // Close enough to current position or destination => no-op.
    if (pointsEqual(position, destination)) {
      return null;
    }
    // Don't allow players in a conversation to move.
    const member = this.conversationMembers.find(
      (m) => m.playerId === playerId && m.status.kind === 'participating',
    );
    if (member) {
      throw new Error(`Can't move when in a conversation. Leave the conversation first!`);
    }
    player.pathfinding = {
      destination: destination,
      started: now,
      state: {
        kind: 'needsPath',
      },
    };
    return null;
  }

  async handleStartConversation(
    now: number,
    { playerId, invitee }: InputArgs<'startConversation'>,
  ): Promise<InputReturnValue<'startConversation'>> {
    console.log(`Starting ${playerId} ${invitee}...`);
    if (playerId === invitee) {
      throw new Error(`Can't invite yourself to a conversation`);
    }
    const player = this.players.lookup(playerId);
    const inviteePlayer = this.players.lookup(invitee);
    if (this.conversationMembers.find((m) => m.playerId === playerId)) {
      throw new Error(`Player ${playerId} is already in a conversation`);
    }
    if (this.conversationMembers.find((m) => m.playerId === invitee)) {
      throw new Error(`Invitee ${playerId} is already in a conversation`);
    }
    const conversationId = await this.conversations.insert({
      creator: playerId,
      worldId: this.world._id,
    });
    console.log(`Creating conversation ${conversationId}`);
    await this.conversationMembers.insert({
      conversationId,
      playerId,
      status: { kind: 'walkingOver' },
    });
    await this.conversationMembers.insert({
      conversationId,
      playerId: invitee,
      status: { kind: 'invited' },
    });
    return conversationId;
  }

  async handleAcceptInvite(
    now: number,
    { playerId, conversationId }: InputArgs<'acceptInvite'>,
  ): Promise<InputReturnValue<'acceptInvite'>> {
    const player = this.players.lookup(playerId);
    const membership = this.conversationMembers.find((m) => m.playerId === playerId);
    if (!membership) {
      throw new Error(`Couldn't find invite for ${playerId}:${conversationId}`);
    }
    if (membership.status.kind !== 'invited') {
      throw new Error(
        `Invalid membership status for ${playerId}:${conversationId}: ${JSON.stringify(
          membership,
        )}`,
      );
    }
    membership.status = { kind: 'walkingOver' };
    return null;
  }

  async handleRejectInvite(
    now: number,
    { playerId, conversationId }: InputArgs<'rejectInvite'>,
  ): Promise<InputReturnValue<'rejectInvite'>> {
    const player = this.players.lookup(playerId);
    const conversation = this.conversations.find((d) => d._id === conversationId);
    if (conversation === null) {
      throw new Error(`Couldn't find conversation: ${conversationId}`);
    }
    const membership = this.conversationMembers.find(
      (m) => m.conversationId == conversationId && m.playerId === playerId,
    );
    if (!membership) {
      throw new Error(`Couldn't find membership for ${conversationId}:${playerId}`);
    }
    if (membership.status.kind !== 'invited') {
      throw new Error(
        `Rejecting invite in wrong membership state: ${conversationId}:${playerId}: ${JSON.stringify(
          membership,
        )}`,
      );
    }
    this.stopConversation(now, conversation);
    return null;
  }

  async handleLeaveConversation(
    now: number,
    { playerId, conversationId }: InputArgs<'leaveConversation'>,
  ): Promise<InputReturnValue<'leaveConversation'>> {
    const player = this.players.lookup(playerId);

    const conversation = this.conversations.find((d) => d._id === conversationId);
    if (conversation === null) {
      throw new Error(`Couldn't find conversation: ${conversationId}`);
    }
    const membership = this.conversationMembers.find(
      (m) => m.conversationId === conversationId && m.playerId === playerId,
    );
    if (!membership) {
      throw new Error(`Couldn't find membership for ${conversationId}:${playerId}`);
    }
    this.stopConversation(now, conversation);
    return null;
  }

  stopConversation(now: number, conversation: Doc<'conversations'>) {
    conversation.finished = now;
    const members = this.conversationMembers.filter((m) => m.conversationId === conversation._id);
    for (const member of members) {
      const started = member.status.kind === 'participating' ? member.status.started : undefined;
      member.status = { kind: 'left', started, ended: now };
    }
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
        console.log(`Failed to route to ${pathfinding.destination}`);
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
    await this.locations.save();
    await this.conversations.save();
    await this.conversationMembers.save();
  }

  idleUntil(now: number): number | null {
    if (this.players.allDocuments().some((p) => !!p.pathfinding)) {
      return null;
    }
    if (this.locations.historyLength() > 0) {
      return null;
    }
    return now + 60 * 60 * 1000;
  }
}
