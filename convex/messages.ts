import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { insertInput } from './aiTown/insertInput';
import { conversationId, playerId } from './aiTown/ids';

export const listMessages = query({
  args: {
    worldId: v.id('worlds'),
    conversationId,
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query('messages')
      .withIndex('conversationId', (q) => q.eq('worldId', args.worldId).eq('conversationId', args.conversationId))
      .collect();
    const out = [];
    for (const message of messages) {
      const playerDescription = await ctx.db
        .query('playerDescriptions')
        .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('playerId', message.author))
        .first();
      if (!playerDescription) {
        throw new Error(`Invalid author ID: ${message.author}`);
      }
      out.push({ ...message, authorName: playerDescription.name });
    }
    return out;
  },
});

export const writeMessage = mutation({
  args: {
    worldId: v.id('worlds'),
    conversationId,
    messageUuid: v.string(),
    playerId,
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized');
    }

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.worldId !== args.worldId) {
      throw new Error('Invalid conversation');
    }
    const conversationRecord = conversation as {
      playerIds?: typeof args.playerId[];
      participants?: typeof args.playerId[];
    };
    const conversationPlayerIds = conversationRecord.playerIds ?? conversationRecord.participants;
    if (!conversationPlayerIds || !conversationPlayerIds.includes(args.playerId)) {
      throw new Error('Player is not in conversation');
    }

    const player = await ctx.db.get(args.playerId);
    if (!player || player.worldId !== args.worldId) {
      throw new Error('Invalid player');
    }
    const playerDescription = await ctx.db
      .query('playerDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('playerId', args.playerId))
      .first();
    if (!playerDescription) {
      throw new Error(`Invalid author ID: ${args.playerId}`);
    }

    const playerRecord = player as {
      active?: boolean;
      userId?: string;
      tokenIdentifier?: string;
    };
    const playerDescriptionRecord = playerDescription as {
      active?: boolean;
      userId?: string;
      tokenIdentifier?: string;
    };
    const isActive = playerDescriptionRecord.active ?? playerRecord.active;
    if (isActive === false) {
      throw new Error('Inactive player');
    }

    const authorizedIdentity =
      playerRecord.userId ??
      playerRecord.tokenIdentifier ??
      playerDescriptionRecord.userId ??
      playerDescriptionRecord.tokenIdentifier;
    if (
      !authorizedIdentity ||
      (authorizedIdentity !== identity.subject && authorizedIdentity !== identity.tokenIdentifier)
    ) {
      throw new Error('Unauthorized');
    }

    await ctx.db.insert('messages', {
      conversationId: args.conversationId,
      author: args.playerId,
      messageUuid: args.messageUuid,
      text: args.text,
      worldId: args.worldId,
    });
    await insertInput(ctx, args.worldId, 'finishSendingMessage', {
      conversationId: args.conversationId,
      playerId: args.playerId,
      timestamp: Date.now(),
    });
  },
});
