import { ObjectType, PropertyValidators, v } from 'convex/values';
import { Doc } from './_generated/dataModel';
import { MutationCtx, mutation } from './_generated/server';
import {
  SessionMiddlewareValidator,
  mutationWithSession,
  queryWithSession,
} from './util/withSession';
import { RegisteredMutation, ValidatedFunction } from 'convex/server';

export const sessionData = queryWithSession({
  args: {},
  handler: async (ctx, args) => {
    if (!ctx.session) return {};
    const { userId } = ctx.session;
    return { userId };
  },
});

export const createOrValidateSession = mutation({
  args: { sessionId: v.union(v.null(), v.string()) },
  handler: async (ctx, args) => {
    if (args.sessionId) {
      const sessionId = ctx.db.normalizeId('sessions', args.sessionId);
      if (sessionId) {
        const session = await ctx.db.get(sessionId);
        if (!session) {
          console.error('Session has disappeared');
        } else if (session?.userId && !(await ctx.db.get(session.userId))) {
          console.error('User for this session has disappeared');
        } else {
          return sessionId;
        }
      }
    }
    // TODO: when we do oauth, don't create a user automatically
    const userId = await ctx.db.insert('users', {});
    return await ctx.db.insert('sessions', { userId });
  },
});

export function mutationWithSessionAuth<ArgsValidator extends PropertyValidators, Output>(
  func: ValidatedFunction<
    MutationCtx & { session: Doc<'sessions'>; user: Doc<'users'> },
    ArgsValidator,
    Promise<Output>
  >,
): RegisteredMutation<
  'public',
  ObjectType<ArgsValidator> & ObjectType<typeof SessionMiddlewareValidator>,
  Output
> {
  return mutationWithSession({
    args: func.args,
    handler: async (ctx, args) => {
      if (!ctx.session.userId) throw new Error('Not logged in');
      const user = await ctx.db.get(ctx.session.userId);
      if (!user) throw new Error('User not found');
      const ctxWithUser = { ...ctx, user };
      return func.handler(ctxWithUser, args);
    },
  });
}
