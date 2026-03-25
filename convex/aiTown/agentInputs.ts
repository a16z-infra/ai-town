import { v } from 'convex/values';
import { agentId, conversationId, parseGameId, playerId } from './ids';
import { Player, activity } from './player';
import { Conversation, conversationInputs } from './conversation';
import { movePlayer } from './movement';
import { inputHandler } from './inputHandler';
import { point } from '../util/types';
import { Descriptions } from '../../data/characters';
import { AgentDescription } from './agentDescription';
import { Agent } from './agent';

export const agentInputs = {
  // Transfer gold between two players (used by trust-driven help and villain scam mechanics)
  transferGold: inputHandler({
    args: {
      fromPlayerId: playerId,
      toPlayerId: playerId,
      amount: v.number(),
    },
    handler: (game, _now, args) => {
      const fromId = parseGameId('players', args.fromPlayerId);
      const toId = parseGameId('players', args.toPlayerId);
      const fromPlayer = game.world.players.get(fromId);
      const toPlayer = game.world.players.get(toId);
      if (!fromPlayer || !toPlayer) {
        console.debug(`transferGold: player not found (from=${args.fromPlayerId}, to=${args.toPlayerId})`);
        return null;
      }
      const amount = Math.min(args.amount, fromPlayer.gold); // Can't take more than they have
      if (amount <= 0) return null;
      fromPlayer.gold = Math.max(0, fromPlayer.gold - amount);
      toPlayer.gold = toPlayer.gold + amount;
      return null;
    },
  }),
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
      needsUpdate: v.optional(v.object({
        hunger: v.optional(v.number()),
        energy: v.optional(v.number()),
        security: v.optional(v.number()),
        social: v.optional(v.number()),
        esteem: v.optional(v.number()),
        fulfillment: v.optional(v.number()),
      })),
      goldChange: v.optional(v.number()),
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
      // Apply needs update (recover or consume) — all fields optional
      if (args.needsUpdate) {
        const clamp = (val: number) => Math.max(0, Math.min(100, val));
        if (args.needsUpdate.hunger != null) player.needs.hunger = clamp(player.needs.hunger + args.needsUpdate.hunger);
        if (args.needsUpdate.energy != null) player.needs.energy = clamp(player.needs.energy + args.needsUpdate.energy);
        if (args.needsUpdate.security != null) player.needs.security = clamp(player.needs.security + args.needsUpdate.security);
        if (args.needsUpdate.social != null) player.needs.social = clamp(player.needs.social + args.needsUpdate.social);
        if (args.needsUpdate.esteem != null) player.needs.esteem = clamp(player.needs.esteem + args.needsUpdate.esteem);
        if (args.needsUpdate.fulfillment != null) player.needs.fulfillment = clamp(player.needs.fulfillment + args.needsUpdate.fulfillment);
      }
      if (args.goldChange) {
        player.gold = Math.max(0, player.gold + args.goldChange);
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
  // Gathering: add resources to player inventory
  gatherResource: inputHandler({
    args: {
      playerId,
      resource: v.string(),
      amount: v.number(),
    },
    handler: (game, _now, args) => {
      const id = parseGameId('players', args.playerId);
      const player = game.world.players.get(id);
      if (!player) return null;
      const res = args.resource as keyof typeof player.inventory;
      if (res in player.inventory) {
        player.inventory[res] = (player.inventory[res] ?? 0) + args.amount;
      }
      return null;
    },
  }),
  // Trade: exchange resources/gold between two players
  executeTrade: inputHandler({
    args: {
      fromPlayerId: playerId,
      toPlayerId: playerId,
      fromGold: v.optional(v.number()),
      toGold: v.optional(v.number()),
      fromResource: v.optional(v.string()),
      fromResourceAmount: v.optional(v.number()),
      toResource: v.optional(v.string()),
      toResourceAmount: v.optional(v.number()),
    },
    handler: (game, _now, args) => {
      const fromId = parseGameId('players', args.fromPlayerId);
      const toId = parseGameId('players', args.toPlayerId);
      const from = game.world.players.get(fromId);
      const to = game.world.players.get(toId);
      if (!from || !to) return null;
      // Exchange gold
      if (args.fromGold && args.fromGold > 0) {
        const amt = Math.min(args.fromGold, from.gold);
        from.gold -= amt;
        to.gold += amt;
      }
      if (args.toGold && args.toGold > 0) {
        const amt = Math.min(args.toGold, to.gold);
        to.gold -= amt;
        from.gold += amt;
      }
      // Exchange resources
      if (args.fromResource && args.fromResourceAmount) {
        const res = args.fromResource as keyof typeof from.inventory;
        if (res in from.inventory) {
          const amt = Math.min(args.fromResourceAmount, from.inventory[res] ?? 0);
          from.inventory[res] = (from.inventory[res] ?? 0) - amt;
          to.inventory[res] = (to.inventory[res] ?? 0) + amt;
        }
      }
      if (args.toResource && args.toResourceAmount) {
        const res = args.toResource as keyof typeof to.inventory;
        if (res in to.inventory) {
          const amt = Math.min(args.toResourceAmount, to.inventory[res] ?? 0);
          to.inventory[res] = (to.inventory[res] ?? 0) - amt;
          from.inventory[res] = (from.inventory[res] ?? 0) + amt;
        }
      }
      // Both gain influence from trading
      from.influence += 1;
      to.influence += 1;
      return null;
    },
  }),
  createAgent: inputHandler({
    args: {
      descriptionIndex: v.number(),
    },
    handler: (game, now, args) => {
      const description = Descriptions[args.descriptionIndex];
      const playerId = Player.join(
        game,
        now,
        description.name,
        description.character,
        description.identity,
        undefined,
        description.homePoiId,
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
          archetype: description.archetype,
          stats: description.stats,
          mbti: description.mbti,
          personality: description.personality,
          homePoiId: description.homePoiId,
        }),
      );
      return { agentId };
    },
  }),
};
