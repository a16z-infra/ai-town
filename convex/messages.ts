import { v } from 'convex/values';
import { DatabaseReader, mutation, query } from './_generated/server';
import { Id } from './_generated/dataModel';
import { insertInput } from './game/main';

export const listMessages = query({
  args: {
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query('messages')
      .withIndex('conversationId', (q) => q.eq('conversationId', args.conversationId))
      .collect();
    const out = [];
    for (const message of messages) {
      const author = await ctx.db.get(message.author);
      if (!author) {
        throw new Error(`Invalid author ID: ${message.author}`);
      }
      out.push({ ...message, authorName: author.name });
    }
    return out;
  },
});

export async function getCurrentlyTyping(db: DatabaseReader, conversationId: Id<'conversations'>) {
  const conversation = await db.get(conversationId);
  if (!conversation) {
    throw new Error(`Invalid conversation ID: ${conversationId}`);
  }
  if (conversation.finished) {
    return null;
  }
  if (!conversation.isTyping) {
    return null;
  }
  const messageReceived = await db
    .query('messages')
    .withIndex('messageUuid', (q) =>
      q.eq('conversationId', conversationId).eq('messageUuid', conversation.isTyping!.messageUuid),
    )
    .first();
  if (messageReceived) {
    return null;
  }
  return conversation.isTyping;
}

export const currentlyTyping = query({
  args: {
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, args) => {
    const typing = await getCurrentlyTyping(ctx.db, args.conversationId);
    if (!typing) {
      return null;
    }
    const player = await ctx.db.get(typing.playerId);
    if (!player) {
      throw new Error(`Invalid player ID: ${typing.playerId}`);
    }
    return { playerName: player.name, ...typing };
  },
});

export const writeMessage = mutation({
  args: {
    worldId: v.id('worlds'),
    conversationId: v.id('conversations'),
    messageUuid: v.string(),
    playerId: v.id('players'),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error(`Invalid conversation ID: ${args.conversationId}`);
    }
    await ctx.db.insert('messages', {
      conversationId: args.conversationId,
      author: args.playerId,
      messageUuid: args.messageUuid,
      text: args.text,
    });
    await insertInput(ctx, args.worldId, 'finishSendingMessage', {
      conversationId: args.conversationId,
      playerId: args.playerId,
      timestamp: Date.now(),
    });
  },
});
