import { v } from 'convex/values';
import {
  DatabaseReader,
  MutationCtx,
  internalMutation,
  mutation,
  query,
} from './_generated/server';
import { TYPING_TIMEOUT } from './constants';
import { internal } from './_generated/api';
import { Id } from './_generated/dataModel';
import { assertNever } from './util/assertNever';

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
  // We have at most one row per conversation in the `typingIndicator` table, so
  // we can fetch a single row to determine if someone's typing.
  const indicator = await db
    .query('typingIndicator')
    .withIndex('conversationId', (q) => q.eq('conversationId', conversationId))
    .unique();
  if (!indicator || !indicator.typing) {
    return null;
  }
  if (indicator.typing.since + TYPING_TIMEOUT < Date.now()) {
    return null;
  }
  return indicator.typing;
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

export async function tryStartTyping(
  ctx: MutationCtx,
  conversationId: Id<'conversations'>,
  playerId: Id<'players'>,
): Promise<'ok' | 'notInConversation' | 'someoneElseTyping'> {
  const member = await ctx.db
    .query('conversationMembers')
    .withIndex('conversationId', (q) =>
      q.eq('conversationId', conversationId).eq('playerId', playerId),
    )
    .unique();
  if (!member || member.status.kind !== 'participating') {
    return 'notInConversation';
  }
  const indicator = await ctx.db
    .query('typingIndicator')
    .withIndex('conversationId', (q) => q.eq('conversationId', conversationId))
    .unique();
  if (!indicator) {
    await ctx.db.insert('typingIndicator', {
      conversationId,
      typing: { playerId: playerId, since: Date.now() },
      versionNumber: 0,
    });
    return 'ok';
  }
  if (indicator.typing) {
    if (indicator.typing.playerId === playerId) {
      return 'ok';
    }
    return 'someoneElseTyping';
  }
  const versionNumber = indicator.versionNumber + 1;
  await ctx.db.patch(indicator._id, {
    typing: { playerId, since: Date.now() },
    versionNumber,
  });
  await ctx.scheduler.runAfter(TYPING_TIMEOUT, internal.messages.clearTyping, {
    conversationId,
    versionNumber,
  });
  return 'ok';
}

export const startTyping = mutation({
  args: {
    conversationId: v.id('conversations'),
    playerId: v.id('players'),
  },
  handler: async (ctx, args) => {
    const result = await tryStartTyping(ctx, args.conversationId, args.playerId);
    switch (result) {
      case 'ok':
        return;
      case 'notInConversation':
        throw new Error(
          `Player ${args.playerId} is not participating in conversation ${args.conversationId}`,
        );
      case 'someoneElseTyping':
        throw new Error(`Someone else is already typing in conversation ${args.conversationId}`);
      default:
        assertNever(result);
    }
  },
});

export const writeMessage = mutation({
  args: {
    conversationId: v.id('conversations'),
    playerId: v.id('players'),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error(`Invalid conversation ID: ${args.conversationId}`);
    }
    const member = await ctx.db
      .query('conversationMembers')
      .withIndex('conversationId', (q) =>
        q.eq('conversationId', args.conversationId).eq('playerId', args.playerId),
      )
      .unique();
    if (!member || member.status.kind !== 'participating') {
      throw new Error(
        `Player ${args.playerId} is not participating in conversation ${args.conversationId}`,
      );
    }
    const indicator = await ctx.db
      .query('typingIndicator')
      .withIndex('conversationId', (q) => q.eq('conversationId', args.conversationId))
      .unique();
    if (indicator?.typing?.playerId === args.playerId) {
      await ctx.db.patch(indicator._id, {
        typing: undefined,
        versionNumber: indicator.versionNumber + 1,
      });
    }
    await ctx.db.insert('messages', {
      conversationId: args.conversationId,
      author: args.playerId,
      text: args.text,
    });
  },
});

export const clearTyping = internalMutation({
  args: {
    conversationId: v.id('conversations'),
    versionNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const indicator = await ctx.db
      .query('typingIndicator')
      .withIndex('conversationId', (q) => q.eq('conversationId', args.conversationId))
      .unique();
    if (!indicator) {
      return;
    }
    if (indicator.versionNumber !== args.versionNumber) {
      return;
    }
    if (!indicator.typing) {
      throw new Error(`No typing indicator to clear despite version number matching`);
    }
    await ctx.db.patch(indicator._id, { typing: undefined, versionNumber: args.versionNumber + 1 });
  },
});
