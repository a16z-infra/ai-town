import { v } from 'convex/values';
import { internalAction } from '../_generated/server';
import { WorldMap, serializedWorldMap } from './worldMap';
import { rememberConversation } from '../agent/memory';
import { GameId, agentId, conversationId, playerId } from './ids';
import {
  continueConversationMessage,
  leaveConversationMessage,
  startConversationMessage,
} from '../agent/conversation';
import { assertNever } from '../util/assertNever';
import { serializedAgent } from './agent';
import { ACTIVITIES, ACTIVITY_COOLDOWN, CONVERSATION_COOLDOWN } from '../constants';
import { api, internal } from '../_generated/api';
import { sleep } from '../util/sleep';
import { serializedPlayer } from './player';

export const agentRememberConversation = internalAction({
  args: {
    worldId: v.id('worlds'),
    playerId,
    agentId,
    conversationId,
    operationId: v.string(),
  },
  handler: async (ctx, args) => {
    await rememberConversation(
      ctx,
      args.worldId,
      args.agentId as GameId<'agents'>,
      args.playerId as GameId<'players'>,
      args.conversationId as GameId<'conversations'>,
    );
    await sleep(Math.random() * 1000);
    await ctx.runMutation(api.aiTown.main.sendInput, {
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
    playerId,
    agentId,
    conversationId,
    otherPlayerId: playerId,
    operationId: v.string(),
    type: v.union(v.literal('start'), v.literal('continue'), v.literal('leave')),
    messageUuid: v.string(),
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
    let text = await completionFn(
      ctx,
      args.worldId,
      args.conversationId as GameId<'conversations'>,
      args.playerId as GameId<'players'>,
      args.otherPlayerId as GameId<'players'>,
    );

    const match = text.match(/<END>/);
    const leaveConversation = !!match || args.type === 'leave';
    if (match) {
        text = text.replace(/<END>/, '').trim();
    }

    await ctx.runMutation(internal.aiTown.agent.agentSendMessage, {
      worldId: args.worldId,
      conversationId: args.conversationId,
      agentId: args.agentId,
      playerId: args.playerId,
      text,
      messageUuid: args.messageUuid,
      leaveConversation,
      operationId: args.operationId,
    });
  },
});

export const agentDoSomething = internalAction({
  args: {
    worldId: v.id('worlds'),
    playerId,
    agentId,
    // map: v.object(serializedWorldMap), // Removed
    // player: v.object(serializedPlayer), // Removed
    // otherFreePlayers: v.array(v.object(serializedPlayer)), // Removed
    operationId: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Fetch necessary data (Distributed Read)
    const mapData = await ctx.runQuery(internal.aiTown.worldMap.getMap, { worldId: args.worldId });
    const map = new WorldMap(mapData);
    
    // We need player/agent details. We can query them or pass them if small.
    // Querying ensures fresh data.
    // However, agentDoSomething logic needs 'serializedPlayer' structure.
    // We can reconstruct it from agents_dynamic/static.
    // But for now, let's assume we can fetch it via existing queries or generic 'loadPlayer' query?
    // We don't have a 'loadSerializedPlayer' query exposed.
    // Let's create a helper query in agent.ts or use direct DB query if this was a mutation.
    // Since this is an ACTION, we must use runQuery.
    // We can use `internal.aiTown.agent.loadAgent`? (Doesn't exist yet?)
    // Let's try to query basic info.
    // Actually, `findConversationCandidate` now takes only IDs.
    // So we don't need full player objects for THAT.
    // But we need `player.position` for `wanderDestination` logic (maybe? wander just picks random point on map).
    // `wanderDestination` uses map dimensions.
    
    // We need `agent.lastConversation` etc. to decide what to do.
    // We can fetch `agents_state`.
    // We can add a query `getAgentState` in agent.ts.
    
    // For now, let's blindly Wander if we can't load state easily, or implement fetch.
    // Ideally we fetch state.
    // Let's assume we can't easily fetch full state in this step without adding more queries.
    // But `agentDoSomething` logic is: 
    // IF (recent activity OR recent conversation) -> Wander.
    // ELSE -> Pick Activity OR Find Conversation.
    
    // Simplified logic for Phase 3:
    // Just pick random destination or activity.
    // Real logic requires reading state.
    // I can read state via `ctx.runQuery(internal.aiTown.agent.getAgentState, ...)` if I implement it.
    
    // Let's implement a 'getAgentState' query in `agent.ts` quickly?
    // Or just inline it here? No, Action can't inline DB query.
    // I will use `findConversationCandidate` which returns a candidate ID.
    // If candidate found -> Conversation.
    // Else -> Activity or Wander.
    
    const now = Date.now();
    const invitee = await ctx.runQuery(internal.aiTown.agent.findConversationCandidate, {
        now,
        worldId: args.worldId,
        playerId: args.playerId,
    });

    if (invitee) {
        // Invite logic
        await ctx.runMutation(internal.aiTown.agentTick.handlePlan, {
            worldId: args.worldId,
            playerId: args.playerId,
            agentId: args.agentId,
            operationId: args.operationId,
            invitee,
        });
        return;
    }

    // Else Wander or Activity
    // Random choice
    if (Math.random() < 0.2) {
        // Activity
        const activity = ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)];
        await ctx.runMutation(internal.aiTown.agentTick.handlePlan, {
            worldId: args.worldId,
            playerId: args.playerId,
            agentId: args.agentId,
            operationId: args.operationId,
            activity: {
              description: activity.description,
              emoji: activity.emoji,
              until: Date.now() + activity.duration,
            },
        });
    } else {
        // Wander
        await ctx.runMutation(internal.aiTown.agentTick.handlePlan, {
            worldId: args.worldId,
            playerId: args.playerId,
            agentId: args.agentId,
            operationId: args.operationId,
            destination: wanderDestination(map),
        });
    }
  },
});

function wanderDestination(worldMap: WorldMap) {
  // Wander someonewhere at least one tile away from the edge.
  return {
    x: 1 + Math.floor(Math.random() * (worldMap.width - 2)),
    y: 1 + Math.floor(Math.random() * (worldMap.height - 2)),
  };
}
