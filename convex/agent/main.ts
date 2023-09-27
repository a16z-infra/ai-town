import { v } from 'convex/values';
import { Doc, Id } from '../_generated/dataModel';
import { MutationCtx, internalAction, internalMutation } from '../_generated/server';
import { CONVERSATION_DISTANCE } from '../constants';
import { mapHeight, mapWidth } from '../data/map';
import { InputArgs, InputNames } from '../game/inputs';
import { insertInput } from '../game/main';
import { startTyping, writeMessage } from '../messages';
import { distance } from '../util/geometry';
import { Point } from '../util/types';
import { loadConversationState } from '../world';
import {
  AWKWARD_CONVERSATION_TIMEOUT,
  CONVERATION_COOLDOWN,
  INPUT_DELAY,
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
import { rememberConversation } from './memory';

const selfInternal = internal.agent.main;

class Agent {
  constructor(
    private ctx: MutationCtx,
    private now: number,
    private agent: Doc<'agents'>,
    private player: Doc<'players'> & { position: Point },
    private engine: Doc<'engines'>,
  ) {}

  static async load(ctx: MutationCtx, agentId: Id<'agents'>, expectedGenerationNumber: number) {
    const now = Date.now();
    const agent = await ctx.db.get(agentId);
    if (!agent) {
      throw new Error(`Invalid agent ID: ${agentId}`);
    }
    const player = await ctx.db.get(agent.playerId);
    if (!player) {
      throw new Error(`Invalid player ID: ${agent.playerId}`);
    }
    const engine = await ctx.db.get(player.engineId);
    if (!engine) {
      throw new Error(`Invalid engine ID: ${player.engineId}`);
    }
    if (!engine.active) {
      throw new Error(`Engine ${player.engineId} is not active`);
    }
    const location = await ctx.db.get(player.locationId);
    if (!location) {
      throw new Error(`Invalid location ID: ${player.locationId}`);
    }
    const position = { x: location.x, y: location.y };
    return new Agent(ctx, now, agent, { ...player, position }, engine);
  }

  async run(): Promise<number> {
    const toRemember = await this.conversationToRemember();

    // If we have a conversation to remember, do that first.
    if (toRemember) {
      // If we're not walking somewhere, start wondering to a random position. It's nice
      // to walk while thinking. (This also gets players to walk away from recently left
      // conversations.)
      if (!this.player.pathfinding) {
        const destination = this.wanderDestination();
        console.log(`Wandering to ${destination} to think`);
        await this.insertInput('moveTo', { playerId: this.player._id, destination });
      }
      await this.ctx.scheduler.runAfter(0, selfInternal.agentRememberConversation, {
        agentId: this.agent._id,
        generationNumber: this.agent.generationNumber,
        playerId: this.player._id,
        conversationId: toRemember,
      });
      return this.now + ACTION_TIMEOUT;
    }

    const playerConversation = await loadConversationState(this.ctx, {
      playerId: this.player._id,
    });

    // If we're not in a conversation, wander around to somewhere to start one.
    if (!playerConversation) {
      if (!this.player.pathfinding) {
        const destination = this.wanderDestination();
        console.log(`Wandering to start a conversation`, destination);
        await this.insertInput('moveTo', { playerId: this.player._id, destination });
      }

      // If we're near another player, try to start a conversation.
      const otherPlayers = await this.loadOtherPlayers();
      const playerLastConversation = otherPlayers
        .flatMap((p) =>
          p.lastConversationWithPlayer ? [p.lastConversationWithPlayer.playerLeft] : [],
        )
        .reduce((a, b) => (a ? Math.max(a, b) : b), null as number | null);

      // Wait a cooldown after finish a conversation to start a new one.
      if (playerLastConversation && this.now < playerLastConversation + CONVERATION_COOLDOWN) {
        console.log(`Not starting a new conversation, just finished one.`);
        return this.now + INPUT_DELAY;
      }

      // Find players that aren't in a conversation and that we haven't talked to too recently.
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

      // Send an invite to the closest one.
      if (eligiblePlayers.length > 0) {
        const nearestPlayer = eligiblePlayers[0];
        console.log(`Inviting ${nearestPlayer.name} to a conversation`);
        await this.insertInput('startConversation', {
          playerId: this.player._id,
          invitee: nearestPlayer._id,
        });
        return this.now + INPUT_DELAY;
      }

      return this.now + INPUT_DELAY;
    }

    if (playerConversation) {
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
        if (otherPlayer.human || Math.random() < INVITE_ACCEPT_PROBABILITY) {
          console.log(`Accepting conversation with ${otherPlayer.name}`);
          await this.insertInput('acceptInvite', {
            playerId: this.player._id,
            conversationId: playerConversation._id,
          });
        } else {
          console.log(`Rejecting conversation with ${otherPlayer.name}`);
          await this.insertInput('rejectInvite', {
            playerId: this.player._id,
            conversationId: playerConversation._id,
          });
        }
        return this.now + INPUT_DELAY;
      }
      if (playerConversation.member.status.kind === 'walkingOver') {
        // Leave a conversation if we've been waiting for too long.
        if (playerConversation.member._creationTime + INVITE_TIMEOUT < this.now) {
          console.log(`Giving up on conversation with ${otherPlayer.name}`);
          await this.insertInput('leaveConversation', {
            playerId: this.player._id,
            conversationId: playerConversation._id,
          });
          return this.now + INPUT_DELAY;
        }
        // Don't keep moving around if we're near enough.
        if (distance(this.player.position, otherPlayer.position) < CONVERSATION_DISTANCE) {
          console.log(`Arrived at ${otherPlayer.name}, waiting for them to accept...`);
          return this.now + INPUT_DELAY;
        }
        // Keep moving towards the other player.
        const destination = {
          x: Math.floor((this.player.position.x + otherPlayer.position.x) / 2),
          y: Math.floor((this.player.position.y + otherPlayer.position.y) / 2),
        };
        console.log(`Walking towards ${otherPlayer.name}...`, destination);
        await this.insertInput('moveTo', { playerId: this.player._id, destination });
        return this.now + INPUT_DELAY;
      }
      if (playerConversation.member.status.kind === 'participating') {
        const started = playerConversation.member.status.since;

        // If we're in a conversation and someone else is typing, wait for
        // them to finish.
        const indicator = await this.ctx.db
          .query('typingIndicator')
          .withIndex('conversationId', (q) => q.eq('conversationId', playerConversation._id))
          .first();
        if (indicator?.typing && indicator.typing.playerId !== this.player._id) {
          console.log(`Waiting for ${otherPlayer.name} to finish typing...`);
          // Poll every second while someone else is typing.
          // TODO: Make this more event driven for faster response times.
          return this.now + 1000;
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
                otherPlayer,
                playerConversation,
                otherPlayer.lastConversationWithPlayer?._id ?? null,
              ),
            );
            return this.now + ACTION_TIMEOUT;
          } else {
            return this.now + INPUT_DELAY;
          }
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
            selfInternal.agentLeaveConversaton,
            this.agentArgs(
              otherPlayer,
              playerConversation,
              otherPlayer.lastConversationWithPlayer?._id ?? null,
            ),
          );
          return this.now + ACTION_TIMEOUT;
        }

        // Wait for the awkward deadline if we sent the last message.
        if (lastMessage.author === this.player._id) {
          const awkwardDeadline = lastMessage._creationTime + AWKWARD_CONVERSATION_TIMEOUT;
          if (this.now < awkwardDeadline) {
            console.log(`Waiting for ${otherPlayer.name} to say something...`);
            return this.now + INPUT_DELAY;
          }
        }

        if (this.now < lastMessage._creationTime + MESSAGE_COOLDOWN) {
          console.log(`Waiting for message cooldown...`);
          return lastMessage._creationTime + MESSAGE_COOLDOWN;
        }

        // Grab the lock and send a message!
        await this.startTyping(playerConversation._id);
        await this.ctx.scheduler.runAfter(
          0,
          selfInternal.agentContinueConversation,
          this.agentArgs(
            otherPlayer,
            playerConversation,
            otherPlayer.lastConversationWithPlayer?._id ?? null,
          ),
        );
        return this.now + ACTION_TIMEOUT;
      }
    }

    // TODO: Make this more event driven.
    console.log('Nothing to do, sleeping for 10s');
    return this.now + 10 * 1000;
  }

  async startTyping(conversationId: Id<'conversations'>) {
    await startTyping(this.ctx, {
      conversationId,
      playerId: this.player._id,
    });
  }

  async insertInput<Name extends InputNames>(name: Name, args: InputArgs<Name>) {
    return await insertInput(this.ctx, this.engine._id, name, args);
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
      const memory = await this.ctx.db
        .query('conversationMemories')
        .withIndex('owner', (q) =>
          q.eq('owner', this.player._id).eq('conversation', member.conversationId),
        )
        .first();
      if (!memory) {
        conversationId = member.conversationId;
      }
      break;
    }
    return conversationId ?? null;
  }

  wanderDestination() {
    // Wander someonewhere at least one tile away from the edge.
    return {
      x: 1 + Math.floor(Math.random() * (mapWidth - 2)),
      y: 1 + Math.floor(Math.random() * (mapHeight - 2)),
    };
  }

  async loadOtherPlayers() {
    const otherPlayers = await this.ctx.db
      .query('players')
      .withIndex('active', (q) => q.eq('engineId', this.player.engineId).eq('active', true))
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
      let lastConversationWithPlayer: (Doc<'conversations'> & { playerLeft: number }) | null = null;
      const members = this.ctx.db
        .query('conversationMembers')
        .withIndex('playerId', (q) => q.eq('playerId', this.player._id).eq('status.kind', 'left'));
      for await (const member of members) {
        const playerMember = await this.ctx.db
          .query('conversationMembers')
          .withIndex('conversationId', (q) =>
            q.eq('conversationId', member.conversationId).eq('playerId', this.player._id),
          )
          .first();
        if (playerMember) {
          const conversation = await this.ctx.db.get(playerMember.conversationId);
          if (!conversation) {
            throw new Error(`Invalid conversation ID: ${playerMember.conversationId}`);
          }
          if (playerMember.status.kind !== 'left') {
            throw new Error(`Conversation ${conversation._id} is not left`);
          }
          lastConversationWithPlayer = { playerLeft: playerMember.status.when, ...conversation };
        }
      }
      players.push({ position, conversation, lastConversationWithPlayer, ...otherPlayer });
    }
    return players;
  }

  agentArgs(
    otherPlayer: Doc<'players'>,
    conversation: Doc<'conversations'>,
    lastConversationId: Id<'conversations'> | null,
  ) {
    return {
      agentId: this.agent._id,
      generationNumber: this.agent.generationNumber,
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
    generationNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      throw new Error(`Invalid agent ID: ${args.agentId}`);
    }
    if (agent.generationNumber !== args.generationNumber) {
      throw new Error(
        `Expected generation number ${args.generationNumber} but got ${agent.generationNumber}`,
      );
    }
    const newGenerationNumber = args.generationNumber + 1;
    await ctx.db.patch(args.agentId, { generationNumber: newGenerationNumber });
    const agentClass = await Agent.load(ctx, args.agentId, args.generationNumber);
    const nextRun = await agentClass.run();
    await ctx.scheduler.runAt(nextRun, selfInternal.agentRun, {
      agentId: args.agentId,
      generationNumber: newGenerationNumber,
    });
  },
});

export const agentRememberConversation = internalAction({
  args: {
    agentId: v.id('agents'),
    generationNumber: v.number(),

    playerId: v.id('players'),
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, args) => {
    await rememberConversation(
      ctx,
      args.agentId,
      args.generationNumber,
      args.playerId,
      args.conversationId,
    );
    await ctx.scheduler.runAfter(0, selfInternal.agentRun, {
      agentId: args.agentId,
      generationNumber: args.generationNumber,
    });
  },
});

export const agentStartConversation = internalAction({
  args: {
    agentId: v.id('agents'),
    generationNumber: v.number(),

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
      generationNumber: args.generationNumber,
      playerId: args.playerId,
      conversationId: args.conversationId,
      text,
      leaveConversation: false,
    });
    await ctx.scheduler.runAfter(0, selfInternal.agentRun, {
      agentId: args.agentId,
      generationNumber: args.generationNumber,
    });
  },
});

export const agentContinueConversation = internalAction({
  args: {
    agentId: v.id('agents'),
    generationNumber: v.number(),

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
      generationNumber: args.generationNumber,
      playerId: args.playerId,
      conversationId: args.conversationId,
      text,
      leaveConversation: false,
    });
    await ctx.scheduler.runAfter(0, selfInternal.agentRun, {
      agentId: args.agentId,
      generationNumber: args.generationNumber,
    });
  },
});

export const agentLeaveConversaton = internalAction({
  args: {
    agentId: v.id('agents'),
    generationNumber: v.number(),

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
      generationNumber: args.generationNumber,
      playerId: args.playerId,
      conversationId: args.conversationId,
      text,
      leaveConversation: true,
    });
    await ctx.scheduler.runAfter(INPUT_DELAY, selfInternal.agentRun, {
      agentId: args.agentId,
      generationNumber: args.generationNumber,
    });
  },
});

export const agentWriteMessage = internalMutation({
  args: {
    agentId: v.id('agents'),
    generationNumber: v.number(),

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
    if (agent.generationNumber !== args.generationNumber) {
      throw new Error(
        `Expected generation number ${args.generationNumber} but got ${agent.generationNumber}`,
      );
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
      return await insertInput(ctx, player.engineId, 'leaveConversation', {
        conversationId: args.conversationId,
        playerId: args.playerId,
      });
    }
  },
});
