import { v } from 'convex/values';
import { agentId, conversationId, parseGameId } from './ids';
import { Player, activity } from './player';
import { Conversation, conversationInputs } from './conversation';
import { movePlayer } from './movement';
import { inputHandler } from './inputHandler';
import { point } from '../util/types';
import { Descriptions } from '../../data/characters';
import { AgentDescription } from './agentDescription';
import { Agent } from './agent';

export const agentInputs = {
  finishRememberConversation: inputHandler({
    args: {
      operationId: v.string(),
      agentId,
    },
    handler: (game, now, args) => {
      const agentId = parseGameId('agents', args.agentId);
      const agent = game.world.agents.get(agentId);
      if (!agent) {
        throw new Error(`Couldn't find agent: ${agentId}`);
      }
      if (
        !agent.inProgressOperation ||
        agent.inProgressOperation.operationId !== args.operationId
      ) {
        console.debug(`Agent ${agentId} isn't remembering ${args.operationId}`);
      } else {
        delete agent.inProgressOperation;
        delete agent.toRemember;
      }
      return null;
    },
  }),
  finishDoSomething: inputHandler({
    args: {
      operationId: v.string(),
      agentId: v.id('agents'),
      destination: v.optional(point),
      invitee: v.optional(v.id('players')),
      activity: v.optional(activity),
    },
    handler: (game, now, args) => {
      const agentId = parseGameId('agents', args.agentId);
      const agent = game.world.agents.get(agentId);
      if (!agent) {
        throw new Error(`Couldn't find agent: ${agentId}`);
      }
      if (
        !agent.inProgressOperation ||
        agent.inProgressOperation.operationId !== args.operationId
      ) {
        console.debug(`Agent ${agentId} didn't have ${args.operationId} in progress`);
        return null;
      }
      delete agent.inProgressOperation;
      const player = game.world.players.get(agent.playerId)!;
      if (args.invitee) {
        const inviteeId = parseGameId('players', args.invitee);
        const invitee = game.world.players.get(inviteeId);
        if (!invitee) {
          throw new Error(`Couldn't find player: ${inviteeId}`);
        }
        Conversation.start(game, now, player, invitee);
        agent.lastInviteAttempt = now;
      }
      if (args.destination) {
        movePlayer(game, now, player, args.destination);
      }
      if (args.activity) {
        player.activity = args.activity;
      }
      return null;
    },
  }),
  agentFinishSendingMessage: inputHandler({
    args: {
      agentId,
      conversationId,
      timestamp: v.number(),
      operationId: v.string(),
      leaveConversation: v.boolean(),
    },
    handler: (game, now, args) => {
      const agentId = parseGameId('agents', args.agentId);
      const agent = game.world.agents.get(agentId);
      if (!agent) {
        throw new Error(`Couldn't find agent: ${agentId}`);
      }
      const player = game.world.players.get(agent.playerId);
      if (!player) {
        throw new Error(`Couldn't find player: ${agent.playerId}`);
      }
      const conversationId = parseGameId('conversations', args.conversationId);
      const conversation = game.world.conversations.get(conversationId);
      if (!conversation) {
        throw new Error(`Couldn't find conversation: ${conversationId}`);
      }
      if (
        !agent.inProgressOperation ||
        agent.inProgressOperation.operationId !== args.operationId
      ) {
        console.debug(`Agent ${agentId} wasn't sending a message ${args.operationId}`);
        return null;
      }
      delete agent.inProgressOperation;
      conversationInputs.finishSendingMessage.handler(game, now, {
        playerId: agent.playerId,
        conversationId: args.conversationId,
        timestamp: args.timestamp,
      });
      if (args.leaveConversation) {
        conversation.leave(game, now, player);
      }
      return null;
    },
  }),
  // createAgent: inputHandler({
  //   args: {
  //     descriptionIndex: v.number(),
  //   },
  //   handler: (game, now, args) => {
  //     const description = Descriptions[args.descriptionIndex];
  //     const playerId = Player.join(
  //       game,
  //       now,
  //       description.name,
  //       description.character,
  //       description.identity,
  //     );
  //     const agentId = game.allocId('agents');
  //     game.world.agents.set(
  //       agentId,
  //       new Agent({
  //         id: agentId,
  //         playerId: playerId,
  //         inProgressOperation: undefined,
  //         lastConversation: undefined,
  //         lastInviteAttempt: undefined,
  //         toRemember: undefined,
  //       }),
  //     );
  //     game.agentDescriptions.set(
  //       agentId,
  //       new AgentDescription({
  //         agentId: agentId,
  //         identity: description.identity,
  //         plan: description.plan,
  //       }),
  //     );
  //     return { agentId };
  //   },
  // }),
  createAgent: inputHandler({
    args: {
      // 支持两种方式：通过 index 或直接传入 agent 信息
      descriptionIndex: v.optional(v.number()),
      agent: v.optional(v.object({
        name: v.string(),
        character: v.string(),
        identity: v.string(),
        plan: v.string()
      }))
    },
    handler: (game, now, args) => {
      let description;
      
      if (args.agent) {
        // 如果直接传入了 agent 信息，使用它
        description = args.agent;
      } else if (args.descriptionIndex !== undefined && Descriptions.length > 0) {
        // fallback 到使用 Descriptions 数组
        description = Descriptions[args.descriptionIndex];
      } else {
        throw new Error('Either agent info or valid descriptionIndex must be provided');
      }

      const playerId = Player.join(
        game,
        now,
        description.name,
        description.character,
        description.identity,
        undefined  
      );

      const agentId = game.allocId('agents');
      game.world.agents.set(
        agentId,
        new Agent({
          id: agentId,
          playerId: playerId,
          inProgressOperation: undefined,
          lastConversation: undefined,
          lastInviteAttempt: undefined,
          toRemember: undefined,
        }),
      );

      game.agentDescriptions.set(
        agentId,
        new AgentDescription({
          agentId: agentId,
          identity: description.identity,
          plan: description.plan,
        }),
      );

      return { agentId };
    },
  }),
};
