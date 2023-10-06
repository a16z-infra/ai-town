import { v } from 'convex/values';
import { DatabaseReader, internalMutation, mutation, query } from './_generated/server';
import { TYPING_TIMEOUT } from './constants';
import { internal } from './_generated/api';
import { wakeupAgents } from './agent/scheduling';
import { Id } from './_generated/dataModel';

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

export const startTyping = mutation({
  args: {
    conversationId: v.id('conversations'),
    playerId: v.id('players'),
  },
  handler: async (ctx, args) => {
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
    if (!indicator) {
      await ctx.db.insert('typingIndicator', {
        conversationId: args.conversationId,
        typing: { playerId: args.playerId, since: Date.now() },
        versionNumber: 0,
      });
      return;
    }
    if (indicator.typing) {
      if (indicator.typing.playerId === args.playerId) {
        return;
      }
      throw new Error(`${indicator.typing.playerId} is already typing`);
    }
    const versionNumber = indicator.versionNumber + 1;
    await ctx.db.patch(indicator._id, {
      typing: { playerId: args.playerId, since: Date.now() },
      versionNumber,
    });
    await ctx.scheduler.runAfter(TYPING_TIMEOUT, internal.messages.clearTyping, {
      conversationId: args.conversationId,
      versionNumber,
    });
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
    await wakeupAgents(ctx, internal.agent.main.agentRun);
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
    await wakeupAgents(ctx, internal.agent.main.agentRun);
  },
});
