import { v } from 'convex/values';
import { api, internal } from './_generated/api';
import { Doc, Id } from './_generated/dataModel';
import {
  DatabaseReader,
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server';
import { Entry, EntryOfType } from './schema';
import { PaginationResult, paginationOptsValidator } from 'convex/server';

export const listMessages = query({
  args: { conversationId: v.id('conversations') },
  handler: async (ctx, args) => {
    const messages = (await conversationQuery(
      ctx.db,
      args.conversationId,
    ).collect()) as EntryOfType<'talking'>[];
    return messages.map(clientMessage);
  },
});

function conversationQuery(db: DatabaseReader, conversationId: Id<'conversations'>) {
  return db
    .query('journal')
    .withIndex('by_conversation', (q) => q.eq('data.conversationId', conversationId as any));
}

export const paginateMessages = query({
  args: { conversationId: v.id('conversations'), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const messages = (await conversationQuery(ctx.db, args.conversationId).paginate(
      args.paginationOpts,
    )) as PaginationResult<EntryOfType<'talking'>>;
    return {
      ...messages,
      page: messages.page.map(clientMessage),
    };
  },
});

function clientMessage(m: EntryOfType<'talking'>) {
  return {
    playerId: m.playerId,
    audience: m.data.audience,
    content: m.data.content,
    ts: m.ts,
  };
}
