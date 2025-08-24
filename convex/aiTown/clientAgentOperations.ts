import { v } from 'convex/values';
import { internalAction, internalQuery, internalMutation } from '../_generated/server';
import { GameId, agentId, conversationId, playerId } from './ids';
import { serializedAgent } from './agent';
import { ACTIVITIES, ACTIVITY_COOLDOWN, CONVERSATION_COOLDOWN } from '../constants';
import { api, internal } from '../_generated/api';
import { sleep } from '../util/sleep';
import { serializedPlayer } from './player';
import { serializedWorldMap } from './worldMap';

// New action that requests client-side LLM generation
export const agentGenerateMessageClient = internalAction({
  args: {
    worldId: v.id('worlds'),
    playerId,
    agentId,
    conversationId,
    otherPlayerId: playerId,
    operationId: v.string(),
    type: v.union(v.literal('start'), v.literal('continue'), v.literal('leave')),
    messageUuid: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the conversation context data needed for client-side generation
    const conversationContext = await ctx.runQuery(internal.aiTown.clientAgentOperations.getConversationContext, {
      worldId: args.worldId,
      playerId: args.playerId,
      otherPlayerId: args.otherPlayerId,
      conversationId: args.conversationId,
      type: args.type,
    });

    // Store the operation data for the client to pick up
    await ctx.runMutation(internal.aiTown.clientAgentOperations.storeClientLLMRequest, {
      worldId: args.worldId,
      agentId: args.agentId,
      operationId: args.operationId,
      messageUuid: args.messageUuid,
      type: args.type,
      conversationContext,
      timestamp: Date.now(),
    });

    // The client will now pick up this request, generate the response, and send it back
    console.log(`Client LLM request stored for agent ${args.agentId}, operation ${args.operationId}`);
  },
});

// Get conversation context for client-side LLM generation
export const getConversationContext = internalQuery({
  args: {
    worldId: v.id('worlds'),
    playerId,
    otherPlayerId: playerId,
    conversationId,
    type: v.union(v.literal('start'), v.literal('continue'), v.literal('leave')),
  },
  handler: async (ctx, args) => {
    const world = await ctx.db.get(args.worldId);
    if (!world) {
      throw new Error(`World ${args.worldId} not found`);
    }

    const player = world.players.find((p) => p.id === args.playerId);
    if (!player) {
      throw new Error(`Player ${args.playerId} not found`);
    }

    const playerDescription = await ctx.db
      .query('playerDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('playerId', args.playerId))
      .first();
    if (!playerDescription) {
      throw new Error(`Player description for ${args.playerId} not found`);
    }

    const otherPlayer = world.players.find((p) => p.id === args.otherPlayerId);
    if (!otherPlayer) {
      throw new Error(`Player ${args.otherPlayerId} not found`);
    }

    const otherPlayerDescription = await ctx.db
      .query('playerDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('playerId', args.otherPlayerId))
      .first();
    if (!otherPlayerDescription) {
      throw new Error(`Player description for ${args.otherPlayerId} not found`);
    }

    const agent = world.agents.find((a) => a.playerId === args.playerId);
    if (!agent) {
      throw new Error(`Agent for player ${args.playerId} not found`);
    }

    const agentDescription = await ctx.db
      .query('agentDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('agentId', agent.id))
      .first();
    if (!agentDescription) {
      throw new Error(`Agent description for ${agent.id} not found`);
    }

    const otherAgent = world.agents.find((a) => a.playerId === args.otherPlayerId);
    let otherAgentDescription;
    if (otherAgent) {
      otherAgentDescription = await ctx.db
        .query('agentDescriptions')
        .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('agentId', otherAgent.id))
        .first();
    }

    // Get conversation history if needed
    let conversationHistory: string[] = [];
    if (args.type === 'continue' || args.type === 'leave') {
      const messages = await ctx.db
        .query('messages')
        .withIndex('conversationId', (q) => q.eq('worldId', args.worldId).eq('conversationId', args.conversationId))
        .order('asc')
        .collect();
      
      conversationHistory = messages.map(msg => {
        const author = msg.author === args.playerId ? playerDescription.name : otherPlayerDescription.name;
        const recipient = msg.author === args.playerId ? otherPlayerDescription.name : playerDescription.name;
        return `${author} to ${recipient}: ${msg.text}`;
      });
    }

    // Get last conversation time
    const lastTogether = await ctx.db
      .query('participatedTogether')
      .withIndex('edge', (q) =>
        q
          .eq('worldId', args.worldId)
          .eq('player1', args.playerId)
          .eq('player2', args.otherPlayerId),
      )
      .order('desc')
      .first();

    return {
      worldId: args.worldId,
      playerId: args.playerId,
      playerName: playerDescription.name,
      playerIdentity: agentDescription.identity,
      playerPlan: agentDescription.plan,
      otherPlayerId: args.otherPlayerId,
      otherPlayerName: otherPlayerDescription.name,
      otherPlayerIdentity: otherAgentDescription?.identity,
      conversationId: args.conversationId,
      conversationHistory,
      memories: [], // TODO: Add memory retrieval if needed
      lastConversationTime: lastTogether?.ended,
    };
  },
});

// Store client LLM request in the database
export const storeClientLLMRequest = internalMutation({
  args: {
    worldId: v.id('worlds'),
    agentId,
    operationId: v.string(),
    messageUuid: v.string(),
    type: v.union(v.literal('start'), v.literal('continue'), v.literal('leave')),
    conversationContext: v.object({
      worldId: v.string(),
      playerId: v.string(),
      playerName: v.string(),
      playerIdentity: v.string(),
      playerPlan: v.string(),
      otherPlayerId: v.string(),
      otherPlayerName: v.string(),
      otherPlayerIdentity: v.optional(v.string()),
      conversationId: v.string(),
      conversationHistory: v.array(v.string()),
      memories: v.array(v.string()),
      lastConversationTime: v.optional(v.number()),
    }),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('clientLLMRequests', {
      worldId: args.worldId,
      agentId: args.agentId,
      operationId: args.operationId,
      messageUuid: args.messageUuid,
      type: args.type,
      conversationContext: args.conversationContext,
      timestamp: args.timestamp,
      status: 'pending',
    });
  },
});

// Keep the existing agentDoSomething as it doesn't need LLM inference
export const agentDoSomething = internalAction({
  args: {
    worldId: v.id('worlds'),
    player: v.object(serializedPlayer),
    agent: v.object(serializedAgent),
    map: v.object(serializedWorldMap),
    otherFreePlayers: v.array(v.object(serializedPlayer)),
    operationId: v.string(),
  },
  handler: async (ctx, args) => {
    const { player, agent } = args;
    const now = Date.now();
    
    // Don't try to start a new conversation if we were just in one.
    const justLeftConversation =
      agent.lastConversation && now < agent.lastConversation + CONVERSATION_COOLDOWN;
    
    // Don't try again if we recently tried to find someone to invite.
    const recentlyAttemptedInvite =
      agent.lastInviteAttempt && now < agent.lastInviteAttempt + CONVERSATION_COOLDOWN;
    
    const recentActivity = player.activity && now < player.activity.until + ACTIVITY_COOLDOWN;
    
    // Decide whether to do an activity or wander somewhere.
    if (!player.pathfinding) {
      if (recentActivity || justLeftConversation) {
        await sleep(Math.random() * 1000);
        await ctx.runMutation(api.aiTown.main.sendInput, {
          worldId: args.worldId,
          name: 'finishDoSomething',
          args: {
            operationId: args.operationId,
            agentId: agent.id,
            destination: {
              x: 1 + Math.floor(Math.random() * 18), // Simplified wander destination
              y: 1 + Math.floor(Math.random() * 18),
            },
          },
        });
        return;
      } else {
        // Have LLM choose the activity & emoji (TODO: Can be done client-side too)
        const activity = ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)];
        await sleep(Math.random() * 1000);
        await ctx.runMutation(api.aiTown.main.sendInput, {
          worldId: args.worldId,
          name: 'finishDoSomething',
          args: {
            operationId: args.operationId,
            agentId: agent.id,
            activity: {
              description: activity.description,
              emoji: activity.emoji,
              until: Date.now() + activity.duration,
            },
          },
        });
        return;
      }
    }

    const invitee =
      justLeftConversation || recentlyAttemptedInvite
        ? undefined
        : await ctx.runQuery(internal.aiTown.agent.findConversationCandidate, {
            now,
            worldId: args.worldId,
            player: args.player,
            otherFreePlayers: args.otherFreePlayers,
          });

    await sleep(Math.random() * 1000);
    await ctx.runMutation(api.aiTown.main.sendInput, {
      worldId: args.worldId,
      name: 'finishDoSomething',
      args: {
        operationId: args.operationId,
        agentId: args.agent.id,
        invitee,
      },
    });
  },
});