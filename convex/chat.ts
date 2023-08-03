import { v } from 'convex/values';
import { api, internal } from './_generated/api';
import { Doc, Id } from './_generated/dataModel';
import {
  DatabaseReader,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server';
import { Entry, EntryOfType } from './types';
import { PaginationResult, paginationOptsValidator } from 'convex/server';
import { Message } from './types';
import { asyncMap } from './lib/utils';

export const listConversations = query({
  args: { worldId: v.id('worlds') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('conversations')
      .withIndex('by_worldId', (q) => q.eq('worldId', args.worldId))
      .order('desc')
      .collect();
  },
});

export const paginateConversations = query({
  args: { worldId: v.id('worlds'), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('conversations')
      .withIndex('by_worldId', (q) => q.eq('worldId', args.worldId))
      .order('desc')
      .paginate(args.paginationOpts);
  },
});

export const paginatePlayerMessages = query({
  args: { playerId: v.id('players'), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const results = (await ctx.db
      .query('journal')
      .withIndex('by_playerId_type_ts', (q) =>
        q.eq('playerId', args.playerId).eq('data.type', 'talking'),
      )
      .order('desc')
      .paginate(args.paginationOpts)) as PaginationResult<EntryOfType<'talking'>>;
    const clientMessage = clientMessageMapper(ctx.db);
    return {
      ...results,
      page: await asyncMap(results.page, async (message) => ({
        ...(await clientMessage(message)),
        conversationId: message.data.conversationId,
      })),
    };
  },
});

export const listMessages = query({
  args: { conversationId: v.id('conversations') },
  handler: async (ctx, args) => {
    const messages = (await conversationQuery(ctx.db, args.conversationId).take(
      1000,
    )) as EntryOfType<'talking'>[];
    return asyncMap(messages, clientMessageMapper(ctx.db));
  },
});

export const paginateMessages = query({
  args: { conversationId: v.id('conversations'), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const messages = (await conversationQuery(ctx.db, args.conversationId).paginate(
      args.paginationOpts,
    )) as PaginationResult<EntryOfType<'talking'>>;
    return {
      ...messages,
      page: await asyncMap(messages.page, clientMessageMapper(ctx.db)),
    };
  },
});

function conversationQuery(db: DatabaseReader, conversationId: Id<'conversations'>) {
  return db
    .query('journal')
    .withIndex('by_conversation', (q) => q.eq('data.conversationId', conversationId as any))
    .order('desc');
}

export function clientMessageMapper(db: DatabaseReader) {
  const getName = async (id: Id<'players'>) => (await db.get(id))?.name || '<Anonymous>';
  const clientMessage = async (m: EntryOfType<'talking'>): Promise<Message> => {
    return {
      from: m.playerId,
      fromName: await getName(m.playerId),
      to: m.data.audience,
      toNames: await asyncMap(m.data.audience, getName),
      content: m.data.content,
      ts: m.ts,
    };
  };
  return clientMessage;
}
