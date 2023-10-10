import { v } from 'convex/values';
import { Doc, Id } from '../_generated/dataModel';
import { MutationCtx, internalAction, internalMutation } from '../_generated/server';
import { CONVERSATION_DISTANCE, MIDPOINT_THRESHOLD } from '../constants';
import { InputArgs, InputNames } from '../game/inputs';
import { insertInput } from '../game/main';
import { startTyping, writeMessage } from '../messages';
import { distance } from '../util/geometry';
import { Point } from '../util/types';
import { loadConversationState } from '../world';
import {
  AWKWARD_CONVERSATION_TIMEOUT,
  CONVERATION_COOLDOWN,
  INVITE_ACCEPT_PROBABILITY,
  INVITE_TIMEOUT,
  MAX_CONVERSATION_DURATION,
  ACTION_TIMEOUT,
  PLAYER_CONVERSATION_COOLDOWN,
  MESSAGE_COOLDOWN,
  MAX_CONVERSATION_MESSAGES,
} from './constants';
import { continueConversation, leaveConversation, startConversation } from './conversation';
import { internal } from '../_generated/api';
import { latestMemoryOfType, rememberConversation } from './memory';
import { WaitingOn, eventDeadline, updateSubscriptions } from './scheduling';
import { scheduleAgentRun } from './scheduling';

const selfInternal = internal.agent.main;

export class Agent {
  constructor(
    private ctx: MutationCtx,
    private now: number,
    private world: Doc<'worlds'>,
    private map: Doc<'maps'>,
    public agent: Doc<'agents'>,
    private player: Doc<'players'> & { position: Point },
  ) {}

  public static async load(ctx: MutationCtx, agent: Doc<'agents'>) {
    const now = Date.now();
    const world = await ctx.db.get(agent.worldId);
    if (!world) {
      throw new Error(`Invalid world ID: ${agent.worldId}`);
    }
    if (world.status !== 'running') {
      console.debug(`World ${world._id} is not running`);
      return null;
    }
    const map = await ctx.db.get(world.mapId);
    if (!map) {
      throw new Error(`Invalid map ID: ${world.mapId}`);
    }
    const player = await ctx.db.get(agent.playerId);
    if (!player) {
      throw new Error(`Invalid player ID: ${agent.playerId}`);
    }
    const location = await ctx.db.get(player.locationId);
    if (!location) {
      throw new Error(`Invalid location ID: ${player.locationId}`);
    }
    const position = { x: location.x, y: location.y };
    return new Agent(ctx, now, world, map, agent, { ...player, position });
  }

  async run(): Promise<WaitingOn[]> {
    const waitingOn: WaitingOn[] = [];
    const toRemember = await this.conversationToRemember();

    // Wait on an in-progress input if we have one. This check helps
    // prevent the agent from continuing to loop if the engine's
    // dead.
    if (this.agent.inProgressInputs.length > 0) {
      const incomplete = [];
      for (const inputId of this.agent.inProgressInputs) {
        const input = await this.ctx.db.get(inputId);
        if (!input) {
          throw new Error(`Invalid input ID: ${inputId}`);
        }
        if (!input.returnValue) {
          incomplete.push(inputId);
        }
      }
      this.agent.inProgressInputs = incomplete;
      if (incomplete.length > 0) {
        console.log(`Waiting on inputs ${JSON.stringify(this.agent.inProgressInputs)}...`);
        for (const inputId of incomplete) {
          waitingOn.push({ kind: 'inputCompleted', inputId });
        }
        return waitingOn;
      }
    }

    // Otherwise, check if we have an in-progress action, expire it if it's past its deadline,
    // and wait on it otherwise.
    if (this.agent.inProgressAction) {
      if (this.now < this.agent.inProgressAction.started + ACTION_TIMEOUT) {
        waitingOn.push({
          kind: 'actionCompleted',
          timeoutDeadline: this.agent.inProgressAction.started + ACTION_TIMEOUT,
        });
        return waitingOn;
      }
      console.log(`Expiring action ${JSON.stringify(this.agent.inProgressAction)}`);
      delete this.agent.inProgressAction;
    }

    // If we have a conversation to remember, do that first.
    if (toRemember) {
      // If we're not walking somewhere, start wondering to a random position. It's nice
      // to walk while thinking. (This also gets players to walk away from recently left
      // conversations.)
      if (!this.player.pathfinding) {
        const destination = this.wanderDestination();
        console.log(`Wandering to ${JSON.stringify(destination)} to think`);
        const inputId = await this.insertInput('moveTo', {
          playerId: this.player._id,
          destination,
        });
        this.agent.inProgressInputs.push(inputId);
        waitingOn.push({ kind: 'inputCompleted', inputId });
        waitingOn.push({ kind: 'movementCompleted' });
      }
      const actionUuid = this.startAction('rememberConversation');
      await this.ctx.scheduler.runAfter(0, selfInternal.agentRememberConversation, {
        agentId: this.agent._id,
        actionUuid,
        playerId: this.player._id,
        conversationId: toRemember,
      });
      waitingOn.push({ kind: 'actionCompleted', timeoutDeadline: this.now + ACTION_TIMEOUT });
      return waitingOn;
    }

    const playerConversation = await loadConversationState(this.ctx, {
      playerId: this.player._id,
    });

    // If we're not in a conversation, wander around to somewhere to start one.
    if (!playerConversation) {
      waitingOn.push({ kind: 'inConversation' });

      if (!this.player.pathfinding) {
        const destination = this.wanderDestination();
        console.log(`Wandering to start a conversation`, destination);
        const inputId = await this.insertInput('moveTo', {
          playerId: this.player._id,
          destination,
        });
        this.agent.inProgressInputs.push(inputId);
        waitingOn.push({ kind: 'inputCompleted', inputId });
      }
      waitingOn.push({ kind: 'movementCompleted' });

      const lastConversationMember = await this.ctx.db
        .query('conversationMembers')
        .withIndex('left', (q) => q.eq('playerId', this.player._id).eq('status.kind', 'left'))
        .order('desc')
        .first();
      let playerLastConversation;
      if (lastConversationMember) {
        if (lastConversationMember.status.kind !== 'left') {
          throw new Error(`Conversation ${lastConversationMember.conversationId} is not left`);
        }
        playerLastConversation = lastConversationMember.status.ended;
      }

      // Wait a cooldown after finishing a conversation to start a new one.
      if (playerLastConversation && this.now < playerLastConversation + CONVERATION_COOLDOWN) {
        waitingOn.push({
          kind: 'nextConversationAttempt',
          nextAttempt: playerLastConversation + CONVERATION_COOLDOWN,
        });
        return waitingOn;
      }

      // Find players that aren't in a conversation and that we haven't talked to too recently.
      const otherPlayers = await this.loadOtherPlayers();
      const eligiblePlayers = otherPlayers
        .filter((p) => p.conversation === null)
        .filter(
          (p) =>
            !p.lastConversationWithPlayer ||
            p.lastConversationWithPlayer.playerLeft + PLAYER_CONVERSATION_COOLDOWN < this.now,
        );
      // Sort by distance.
      eligiblePlayers.sort(
        (a, b) =>
          distance(a.position, this.player.position) - distance(b.position, this.player.position),
      );

      // If there's no one eligible, wait a minute for someone to become eligible.
      if (eligiblePlayers.length === 0) {
        waitingOn.push({
          kind: 'nextConversationAttempt',
          nextAttempt: this.now + PLAYER_CONVERSATION_COOLDOWN,
        });
        return waitingOn;
      }

      // Send an invite to the closest one.
      const nearestPlayer = eligiblePlayers[0];
      console.log(`Inviting ${nearestPlayer.name} to a conversation`);
      const inputId = await this.insertInput('startConversation', {
        playerId: this.player._id,
        invitee: nearestPlayer._id,
      });
      this.agent.inProgressInputs.push(inputId);
      waitingOn.push({ kind: 'inputCompleted', inputId });
      return waitingOn;
    }

    if (playerConversation) {
      waitingOn.push({ kind: 'conversationLeft', conversationId: playerConversation._id });

      const otherPlayers = await this.loadOtherPlayers();
      const otherPlayer = otherPlayers.find(
        (p) => p.conversation && p.conversation._id === playerConversation._id,
      );
      if (!otherPlayer) {
        throw new Error(`Other player for conversation ${playerConversation._id} not found`);
      }
      if (playerConversation.member.status.kind === 'invited') {
        // Accept a conversation with another agent with some probability and with
        // a human unconditionally.
        let inputId;
        if (otherPlayer.human || Math.random() < INVITE_ACCEPT_PROBABILITY) {
          console.log(`Accepting conversation with ${otherPlayer.name}`);
          inputId = await this.insertInput('acceptInvite', {
            playerId: this.player._id,
            conversationId: playerConversation._id,
          });
        } else {
          console.log(`Rejecting conversation with ${otherPlayer.name}`);
          inputId = await this.insertInput('rejectInvite', {
            playerId: this.player._id,
            conversationId: playerConversation._id,
          });
        }
        // Wait for our acceptance or rejection to be processed.
        this.agent.inProgressInputs.push(inputId);
        waitingOn.push({
          kind: 'inputCompleted',
          inputId,
        });
        return waitingOn;
      }
      if (playerConversation.member.status.kind === 'walkingOver') {
        // Leave a conversation if we've been waiting for too long.
        if (playerConversation.member._creationTime + INVITE_TIMEOUT < this.now) {
          console.log(`Giving up on conversation with ${otherPlayer.name}`);
          const inputId = await this.insertInput('leaveConversation', {
            playerId: this.player._id,
            conversationId: playerConversation._id,
          });
          this.agent.inProgressInputs.push(inputId);
          waitingOn.push({ kind: 'inputCompleted', inputId });
          return waitingOn;
        }
        // Don't keep moving around if we're near enough.
        const playerDistance = distance(this.player.position, otherPlayer.position);
        if (playerDistance < CONVERSATION_DISTANCE) {
          console.log(`Arrived at ${otherPlayer.name}, waiting for them to accept...`);
          waitingOn.push({
            kind: 'conversationParticipating',
            conversationId: playerConversation._id,
            deadline: playerConversation.member._creationTime + INVITE_TIMEOUT,
          });
          return waitingOn;
        }
        // Keep moving towards the other player.
        // If we're close enough to the player, just walk to them directly.
        let destination;
        if (playerDistance < MIDPOINT_THRESHOLD) {
          destination = {
            x: Math.floor(otherPlayer.position.x),
            y: Math.floor(otherPlayer.position.y),
          };
        } else {
          destination = {
            x: Math.floor((this.player.position.x + otherPlayer.position.x) / 2),
            y: Math.floor((this.player.position.y + otherPlayer.position.y) / 2),
          };
        }
        console.log(`Walking towards ${otherPlayer.name}...`, destination);
        const inputId = await this.insertInput('moveTo', {
          playerId: this.player._id,
          destination,
        });
        this.agent.inProgressInputs.push(inputId);
        waitingOn.push({ kind: 'inputCompleted', inputId });
        waitingOn.push({ kind: 'movementCompleted' });
        waitingOn.push({
          kind: 'conversationParticipating',
          conversationId: playerConversation._id,
          deadline: playerConversation.member._creationTime + INVITE_TIMEOUT,
        });
        return waitingOn;
      }
      if (playerConversation.member.status.kind === 'participating') {
        const started = playerConversation.member.status.started;

        // If we're in a conversation and someone else is typing, wait for
        // them to finish.
        const indicator = await this.ctx.db
          .query('typingIndicator')
          .withIndex('conversationId', (q) => q.eq('conversationId', playerConversation._id))
          .first();
        if (indicator?.typing && indicator.typing.playerId !== this.player._id) {
          console.log(`Waiting for ${otherPlayer.name} to finish typing...`);
          waitingOn.push({ kind: 'nobodyTyping', conversationId: playerConversation._id });
          return waitingOn;
        }

        const messages = await this.ctx.db
          .query('messages')
          .withIndex('conversationId', (q) => q.eq('conversationId', playerConversation._id))
          .collect();
        const lastMessage = messages.at(-1);

        // If no one's said anything, start talking immediately if we
        // created the conversation, and wait otherwise.
        if (!lastMessage) {
          const initiator = playerConversation.creator === this.player._id;
          const awkwardDeadline = started + AWKWARD_CONVERSATION_TIMEOUT;
          if (initiator || awkwardDeadline < this.now) {
            // Grab the lock on the conversation.
            await this.startTyping(playerConversation._id);
            // Schedule the action to ask the LLM for a starting message, write it out, and then reschedule us.
            await this.ctx.scheduler.runAfter(
              0,
              selfInternal.agentStartConversation,
              this.agentArgs(
                'startConversation',
                otherPlayer,
                playerConversation,
                otherPlayer.lastConversationWithPlayer?._id ?? null,
              ),
            );
            waitingOn.push({ kind: 'actionCompleted', timeoutDeadline: this.now + ACTION_TIMEOUT });
            return waitingOn;
          }
          // Wait for the other player to say something.
          waitingOn.push({
            kind: 'waitingForNewMessage',
            conversationId: playerConversation._id,
            until: awkwardDeadline,
          });
          return waitingOn;
        }

        // See if the conversation has been going on too long and decide to leave.
        if (
          started + MAX_CONVERSATION_DURATION < this.now ||
          messages.length >= MAX_CONVERSATION_MESSAGES
        ) {
          console.log(`Leaving conversation with ${otherPlayer.name} after too long`);
          await this.startTyping(playerConversation._id);
          await this.ctx.scheduler.runAfter(
            0,
            selfInternal.agentLeaveConversation,
            this.agentArgs(
              'leaveConversation',
              otherPlayer,
              playerConversation,
              otherPlayer.lastConversationWithPlayer?._id ?? null,
            ),
          );
          waitingOn.push({ kind: 'actionCompleted', timeoutDeadline: this.now + ACTION_TIMEOUT });
          return waitingOn;
        }
        waitingOn.push({
          kind: 'conversationTooLong',
          deadline: started + MAX_CONVERSATION_DURATION,
        });

        // Wait for the awkward deadline if we sent the last message.
        if (lastMessage.author === this.player._id) {
          const awkwardDeadline = lastMessage._creationTime + AWKWARD_CONVERSATION_TIMEOUT;
          if (this.now < awkwardDeadline) {
            console.log(`Waiting for ${otherPlayer.name} to say something...`);
            waitingOn.push({
              kind: 'waitingForNewMessage',
              until: awkwardDeadline,
              conversationId: playerConversation._id,
              lastMessageId: lastMessage._id,
            });
            return waitingOn;
          }
        }

        if (this.now < lastMessage._creationTime + MESSAGE_COOLDOWN) {
          console.log(`Waiting for message cooldown...`);
          waitingOn.push({
            kind: 'waitingForNewMessage',
            until: lastMessage._creationTime + MESSAGE_COOLDOWN,
            conversationId: playerConversation._id,
            lastMessageId: lastMessage._id,
          });
          return waitingOn;
        }

        // Grab the lock and send a message!
        await this.startTyping(playerConversation._id);
        await this.ctx.scheduler.runAfter(
          0,
          selfInternal.agentContinueConversation,
          this.agentArgs(
            'continueConversation',
            otherPlayer,
            playerConversation,
            otherPlayer.lastConversationWithPlayer?._id ?? null,
          ),
        );
        waitingOn.push({ kind: 'actionCompleted', timeoutDeadline: this.now + ACTION_TIMEOUT });
        return waitingOn;
      }
    }
    return waitingOn;
  }

  async startTyping(conversationId: Id<'conversations'>) {
    await startTyping(this.ctx, {
      conversationId,
      playerId: this.player._id,
    });
  }

  async insertInput<Name extends InputNames>(name: Name, args: InputArgs<Name>) {
    return await insertInput(this.ctx, this.world._id, name, args);
  }

  async conversationToRemember() {
    // Walk our left conversations in decreasing creation time order, skipping
    // conversations that don't have any messages.
    const leftConversations = this.ctx.db
      .query('conversationMembers')
      .withIndex('playerId', (q) => q.eq('playerId', this.player._id).eq('status.kind', 'left'))
      .order('desc');
    let conversationId;
    for await (const member of leftConversations) {
      // Skip conversations that don't have any messages.
      const firstMessage = await this.ctx.db
        .query('messages')
        .withIndex('conversationId', (q) => q.eq('conversationId', member.conversationId))
        .first();
      if (!firstMessage) {
        continue;
      }
      const memory = await latestMemoryOfType(this.ctx.db, this.player._id, 'conversation');
      // If the most recent memory is not for this conversation, remember it.
      // We assume we've remembered previous conversations.
      if (memory?.data.conversationId !== member.conversationId) {
        conversationId = member.conversationId;
      }
      break;
    }
    return conversationId ?? null;
  }

  wanderDestination() {
    // Wander someonewhere at least one tile away from the edge.
    return {
      x: 1 + Math.floor(Math.random() * (this.map.width - 2)),
      y: 1 + Math.floor(Math.random() * (this.map.height - 2)),
    };
  }

  async loadOtherPlayers() {
    const otherPlayers = await this.ctx.db
      .query('players')
      .withIndex('active', (q) => q.eq('worldId', this.player.worldId).eq('active', true))
      .filter((q) => q.neq(q.field('_id'), this.player._id))
      .collect();
    const players = [];
    for (const otherPlayer of otherPlayers) {
      const location = await this.ctx.db.get(otherPlayer.locationId);
      if (!location) {
        throw new Error(`Invalid location ID: ${otherPlayer.locationId}`);
      }
      const position = { x: location.x, y: location.y };

      const conversation = await loadConversationState(this.ctx, {
        playerId: otherPlayer._id,
      });

      // Find the latest conversation we're both members of.
      const lastMember = await this.ctx.db
        .query('conversationMembers')
        .withIndex('left', (q) =>
          q
            .eq('playerId', this.player._id)
            .eq('status.kind', 'left')
            .eq('status.with', otherPlayer._id),
        )
        .order('desc')
        .first();

      let lastConversationWithPlayer: (Doc<'conversations'> & { playerLeft: number }) | null = null;
      if (lastMember) {
        if (lastMember.status.kind !== 'left') {
          throw new Error(`Conversation ${lastMember.conversationId} is not left`);
        }
        const conversation = await this.ctx.db.get(lastMember.conversationId);
        if (!conversation) {
          throw new Error(`Invalid conversation ID: ${lastMember.conversationId}`);
        }
        lastConversationWithPlayer = { playerLeft: lastMember.status.ended, ...conversation };
      }
      players.push({ position, conversation, lastConversationWithPlayer, ...otherPlayer });
    }
    return players;
  }

  startAction(name: string) {
    if (this.agent.inProgressAction) {
      throw new Error(`Action already in progress`);
    }
    const uuid = crypto.randomUUID();
    this.agent.inProgressAction = {
      name,
      uuid,
      started: this.now,
    };
    return uuid;
  }

  agentArgs(
    name: string,
    otherPlayer: Doc<'players'>,
    conversation: Doc<'conversations'>,
    lastConversationId: Id<'conversations'> | null,
  ) {
    const actionUuid = this.startAction(name);
    return {
      agentId: this.agent._id,
      actionUuid,
      playerId: this.player._id,
      otherPlayerId: otherPlayer._id,
      conversationId: conversation._id,
      lastConversationId,
    };
  }
}

export const agentRun = internalMutation({
  args: {
    agentId: v.id('agents'),
    runId: v.id('agentScheduledRuns'),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      throw new Error(`Invalid agent ID: ${args.agentId}`);
    }
    if (!agent.running) {
      console.debug(`Agent ${args.agentId} is stopped`);
      return;
    }
    const run = await ctx.db.get(args.runId);
    if (!run) {
      console.debug(`Invalid agent run ID: ${args.runId}`);
      return;
    }
    await ctx.db.delete(run._id);

    const agentClass = await Agent.load(ctx, agent);
    if (!agentClass) {
      return;
    }
    const waitingOn = await agentClass.run();

    // Update our agent state.
    // Serialize all runs of the agent via the generation number.
    agent.generationNumber++;
    agent.waitingOn = waitingOn;
    await ctx.db.replace(agent._id, agent);

    // Compute and update the agent's scheduler state.
    let nextRun = undefined;
    for (const event of waitingOn) {
      const deadline = eventDeadline(event);
      if (deadline !== null) {
        nextRun = Math.min(deadline, nextRun ?? deadline);
      }
    }
    await updateSubscriptions(ctx.db, agent._id, agent.playerId, waitingOn);

    // Schedule an agent run in the future, if needed.
    if (nextRun) {
      await scheduleAgentRun(ctx, selfInternal.agentRun, agent._id, nextRun, 'timer');
    }
  },
});

export const agentRememberConversation = internalAction({
  args: {
    agentId: v.id('agents'),
    actionUuid: v.string(),
    playerId: v.id('players'),
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, args) => {
    await rememberConversation(
      ctx,
      args.agentId,
      args.actionUuid,
      args.playerId,
      args.conversationId,
    );
    await ctx.runMutation(selfInternal.agentFinishRememberConversation, {
      agentId: args.agentId,
      actionUuid: args.actionUuid,
    });
  },
});

export const agentFinishRememberConversation = internalMutation({
  args: {
    agentId: v.id('agents'),
    actionUuid: v.string(),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      throw new Error(`Invalid agent ID: ${args.agentId}`);
    }
    if (!agent.inProgressAction || agent.inProgressAction.uuid !== args.actionUuid) {
      console.debug(
        `Current action cancelled: ${args.actionUuid} vs. ${JSON.stringify(
          agent.inProgressAction,
        )}`,
      );
      return;
    }
    delete agent.inProgressAction;
    await ctx.db.replace(agent._id, agent);
    await scheduleAgentRun(ctx, selfInternal.agentRun, agent._id, Date.now(), 'actionCompleted');
  },
});

export const agentStartConversation = internalAction({
  args: {
    agentId: v.id('agents'),
    actionUuid: v.string(),

    playerId: v.id('players'),
    otherPlayerId: v.id('players'),
    conversationId: v.id('conversations'),
    lastConversationId: v.union(v.id('conversations'), v.null()),
  },
  handler: async (ctx, args) => {
    const tokenStream = await startConversation(
      ctx,
      args.conversationId,
      args.playerId,
      args.otherPlayerId,
      args.lastConversationId,
    );
    const text = await tokenStream.readAll();
    await ctx.runMutation(selfInternal.agentWriteMessage, {
      agentId: args.agentId,
      actionUuid: args.actionUuid,
      playerId: args.playerId,
      conversationId: args.conversationId,
      text,
      leaveConversation: false,
    });
  },
});

export const agentContinueConversation = internalAction({
  args: {
    agentId: v.id('agents'),
    actionUuid: v.string(),

    playerId: v.id('players'),
    otherPlayerId: v.id('players'),
    conversationId: v.id('conversations'),
    lastConversationId: v.union(v.id('conversations'), v.null()),
  },
  handler: async (ctx, args) => {
    const tokenStream = await continueConversation(
      ctx,
      args.conversationId,
      args.playerId,
      args.otherPlayerId,
      args.lastConversationId,
    );
    const text = await tokenStream.readAll();
    await ctx.runMutation(selfInternal.agentWriteMessage, {
      agentId: args.agentId,
      actionUuid: args.actionUuid,
      playerId: args.playerId,
      conversationId: args.conversationId,
      text,
      leaveConversation: false,
    });
  },
});

export const agentLeaveConversation = internalAction({
  args: {
    agentId: v.id('agents'),
    actionUuid: v.string(),

    playerId: v.id('players'),
    otherPlayerId: v.id('players'),
    conversationId: v.id('conversations'),
    lastConversationId: v.union(v.id('conversations'), v.null()),
  },
  handler: async (ctx, args) => {
    const tokenStream = await leaveConversation(
      ctx,
      args.conversationId,
      args.playerId,
      args.otherPlayerId,
      args.lastConversationId,
    );
    const text = await tokenStream.readAll();
    await ctx.runMutation(selfInternal.agentWriteMessage, {
      agentId: args.agentId,
      actionUuid: args.actionUuid,
      playerId: args.playerId,
      conversationId: args.conversationId,
      text,
      leaveConversation: true,
    });
  },
});

export const agentWriteMessage = internalMutation({
  args: {
    agentId: v.id('agents'),
    actionUuid: v.string(),

    playerId: v.id('players'),
    conversationId: v.id('conversations'),
    text: v.string(),

    leaveConversation: v.boolean(),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      throw new Error(`Invalid agent ID: ${args.agentId}`);
    }
    if (!agent.inProgressAction || agent.inProgressAction.uuid !== args.actionUuid) {
      console.debug(
        `Current action cancelled: ${args.actionUuid} vs. ${JSON.stringify(
          agent.inProgressAction,
        )}`,
      );
      return;
    }
    await writeMessage(ctx, {
      conversationId: args.conversationId,
      playerId: args.playerId,
      text: args.text,
    });
    if (args.leaveConversation) {
      const player = await ctx.db.get(args.playerId);
      if (!player) {
        throw new Error(`Invalid player ID: ${args.playerId}`);
      }
      const inputId = await insertInput(ctx, player.worldId, 'leaveConversation', {
        conversationId: args.conversationId,
        playerId: args.playerId,
      });
      agent.inProgressInputs.push(inputId);
    }
    delete agent.inProgressAction;
    await ctx.db.replace(agent._id, agent);
    await scheduleAgentRun(ctx, selfInternal.agentRun, agent._id, Date.now(), 'actionCompleted');
  },
});
