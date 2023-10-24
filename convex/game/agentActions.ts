'use node';

import { v } from 'convex/values';
import { internalAction } from '../_generated/server';
import { api, internal } from '../_generated/api';
import { rememberConversation } from '../agent/memory';
import {
  startConversationMessage,
  continueConversationMessage,
  leaveConversationMessage,
} from '../agent/conversation';
import { assertNever } from '../util/assertNever';
import { ACTIVITIES, agentDoc } from './agents';
import { CONVERSATION_COOLDOWN, ACTIVITY_COOLDOWN } from '../constants';
import { Doc } from '../_generated/dataModel';
import { playerDoc } from './players';
import { mapDoc } from './schema';

export const agentRememberConversation = internalAction({
  args: {
    worldId: v.id('worlds'),
    playerId: v.id('players'),
    agentId: v.id('agents'),
    conversationId: v.id('conversations'),
    operationId: v.string(),
  },
  handler: async (ctx, args) => {
    await rememberConversation(ctx, args.agentId, args.playerId, args.conversationId);
    await ctx.runMutation(api.game.main.sendInput, {
      worldId: args.worldId,
      name: 'finishRememberConversation',
      args: {
        agentId: args.agentId,
        operationId: args.operationId,
      },
    });
  },
});

export const agentGenerateMessage = internalAction({
  args: {
    worldId: v.id('worlds'),
    conversationId: v.id('conversations'),
    agentId: v.id('agents'),
    playerId: v.id('players'),
    otherPlayerId: v.id('players'),

    type: v.union(v.literal('start'), v.literal('continue'), v.literal('leave')),
    messageUuid: v.string(),
    operationId: v.string(),
  },
  handler: async (ctx, args) => {
    let completionFn;
    switch (args.type) {
      case 'start':
        completionFn = startConversationMessage;
        break;
      case 'continue':
        completionFn = continueConversationMessage;
        break;
      case 'leave':
        completionFn = leaveConversationMessage;
        break;
      default:
        assertNever(args.type);
    }
    const completion = await completionFn(
      ctx,
      args.conversationId,
      args.playerId,
      args.otherPlayerId,
    );
    const text = await completion.readAll();
    await ctx.runMutation(internal.game.agents.agentSendMessage, {
      worldId: args.worldId,
      conversationId: args.conversationId,
      agentId: args.agentId,
      messageUuid: args.messageUuid,
      text,
      leaveConversation: args.type === 'leave',
      operationId: args.operationId,
    });
  },
});

export const agentDoSomething = internalAction({
  args: {
    worldId: v.id('worlds'),
    player: playerDoc,
    agent: agentDoc,
    map: mapDoc,
    operationId: v.string(),
  },
  handler: async (ctx, { worldId, map, player, agent, operationId }) => {
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
        await ctx.runMutation(api.game.main.sendInput, {
          worldId,
          name: 'finishDoSomething',
          args: {
            operationId,
            agentId: agent._id,
            destination: wanderDestination(map),
          },
        });
        return;
      } else {
        // TODO: have LLM choose the activity & emoji
        const activity = ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)];
        await ctx.runMutation(api.game.main.sendInput, {
          worldId,
          name: 'finishDoSomething',
          args: {
            operationId,
            agentId: agent._id,
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
        : await ctx.runQuery(internal.game.agents.findConversationCandidate, {
            playerId: player._id,
            locationId: player.locationId,
            worldId,
            now,
          });

    await ctx.runMutation(api.game.main.sendInput, {
      worldId,
      name: 'finishDoSomething',
      args: {
        operationId,
        agentId: agent._id,
        invitee,
      },
    });
  },
});

function wanderDestination(map: Doc<'maps'>) {
  // Wander someonewhere at least one tile away from the edge.
  return {
    x: 1 + Math.floor(Math.random() * (map.width - 2)),
    y: 1 + Math.floor(Math.random() * (map.height - 2)),
  };
}
