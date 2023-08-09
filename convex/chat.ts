import { v } from 'convex/values';
import { Id } from './_generated/dataModel';
import { DatabaseReader, query } from './_generated/server';
import { EntryOfType, MessageEntry } from './schema';
import { PaginationResult, paginationOptsValidator } from 'convex/server';
import { Message } from './schema';
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
      .withIndex('by_playerId_type', (q) =>
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
    )) as MessageEntry[];
    return asyncMap(messages, clientMessageMapper(ctx.db));
  },
});

export const paginateMessages = query({
  args: { conversationId: v.id('conversations'), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const messages = (await conversationQuery(ctx.db, args.conversationId).paginate(
      args.paginationOpts,
    )) as PaginationResult<MessageEntry>;
    return {
      ...messages,
      page: await asyncMap(messages.page, clientMessageMapper(ctx.db)),
    };
  },
});

function conversationQuery(db: DatabaseReader, conversationId: Id<'conversations'>) {
  return (
    db
      .query('journal')
      .withIndex('by_conversation', (q) => q.eq('data.conversationId', conversationId as any))
      // .filter((q) => q.eq(q.field('data.type'), 'talking'))
      .order('desc')
  );
}

export function clientMessageMapper(db: DatabaseReader) {
  const getName = async (id: Id<'players'>) => (await db.get(id))?.name || '<Anonymous>';
  const clientMessage = async (m: MessageEntry): Promise<Message> => {
    const common = {
      from: m.playerId,
      fromName: await getName(m.playerId),
      to: m.data.audience,
      toNames: await asyncMap(m.data.audience, getName),
      ts: m._creationTime,
    };
    return m.data.type === 'talking'
      ? {
          ...common,
          type: 'responded',
          content: m.data.content,
        }
      : m.data.type === 'startConversation'
      ? {
          ...common,
          type: 'started',
        }
      : {
          ...common,
          type: 'left',
        };
  };
  return clientMessage;
}
