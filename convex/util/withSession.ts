/**
 * Allows you to persist state server-side, associated with a sessionId stored
 * on the client (in localStorage, e.g.). You wrap your mutation / query with
 * withSession or withOptionalSession and it passes in "session" in the "ctx"
 * (first parameter) argument to your function.
 *
 * There are three wrappers:
 * - withSession
 * - withOptionalSession -- allows the sessionId to be null or a non-existent document and passes `session: null` if so
 * - withSessionBackwardsCompatible -- supports session IDs created with the ID class (Convex 0.16 and earlier)
 */
import {
  ArgsArray,
  RegisteredMutation,
  RegisteredQuery,
  UnvalidatedFunction,
  ValidatedFunction,
} from 'convex/server';
import { Doc, Id } from '../_generated/dataModel';
import { DatabaseReader, mutation, MutationCtx, query, QueryCtx } from '../_generated/server';
import { ObjectType, PropertyValidators, v } from 'convex/values';
import { MergeArgsForRegistered, generateMiddleware } from './middlewareUtils';

/** -----------------------------------------------------------------
 * withSession
 * ----------------------------------------------------------------- */
export const SessionMiddlewareValidator = { sessionId: v.id('sessions') };
const transformContextForSession = async <Ctx>(
  ctx: Ctx & { db: DatabaseReader },
  args: { sessionId: Id<'sessions'> },
): Promise<Ctx & { session: Doc<'sessions'> }> => {
  const session = (await ctx.db.get(args.sessionId)) ?? null;
  if (session === null) {
    throw new Error(
      'Session must be initialized first. ' +
        'Are you wrapping your code with <SessionProvider>? ' +
        'Are you requiring a session from a query that executes immediately?',
    );
  }
  return { ...ctx, session };
};

/**
 * Wrapper for a Convex query or mutation function that provides a session in ctx.
 *
 * Throws an exception if there isn't a valid session.
 * Requires `sessionId` (type: Id<"sessions">) as a parameter.
 * This is provided by * default by using {@link useSessionQuery} or {@link useSessionMutation}.
 * Pass this to `query`, `mutation`, or another wrapper. E.g.:
 * ```ts
 * export default mutation(withSession({
 *   args: { arg1: ... },
 *   handler: async ({ db, auth, session }, { arg1 }) => {...}
 * }));
 * ```
 * @param func - Your function that can take in a `session` in the first (ctx) param.
 * @returns A function to be passed to `query` or `mutation`.
 */
export const withSession = generateMiddleware<
  { db: DatabaseReader },
  { session: Doc<'sessions'> },
  typeof SessionMiddlewareValidator
>(SessionMiddlewareValidator, transformContextForSession);

/** -----------------------------------------------------------------
 * withOptionalSession
 * ----------------------------------------------------------------- */

export const OptionalSessionMiddlewareValidator = {
  sessionId: v.union(v.null(), v.id('sessions')),
};
const transformContextForOptionalSession = async <Ctx>(
  ctx: Ctx & { db: DatabaseReader },
  args: ObjectType<typeof OptionalSessionMiddlewareValidator>,
): Promise<Ctx & { session: Doc<'sessions'> | null }> => {
  const session = args.sessionId ? await ctx.db.get(args.sessionId) : null;
  return { ...ctx, session };
};

/**
 * Wrapper for a Convex query or mutation function that provides a session in ctx.
 *
 * The session will be `null` if the sessionId passed up was null or invalid.
 * Requires `sessionId` (type: Id<"sessions">) as a parameter.
 * This is provided by * default by using {@link useSessionQuery} or {@link useSessionMutation}.
 * Pass this to `query`, `mutation`, or another wrapper. E.g.:
 * ```ts
 * export default mutation(withOptionalSession({
 *   args: { arg1: ... },
 *   handler: async ({ db, auth, session }, { arg1 }) => {...}
 * }));
 * ```
 * @param func - Your function that can take in a `session` in the first (ctx) param.
 * @returns A function to be passed to `query` or `mutation`.
 */
export const withOptionalSession = generateMiddleware<
  { db: DatabaseReader },
  { session: Doc<'sessions'> | null },
  typeof OptionalSessionMiddlewareValidator
>(OptionalSessionMiddlewareValidator, transformContextForOptionalSession);

/** -----------------------------------------------------------------
 * Function wrappers
 * ----------------------------------------------------------------- */

/**
 * Wrapper for a Convex mutation function that provides a session in ctx.
 *
 * E.g.:
 * ```ts
 * export default mutationWithSession({
 *   args: { arg1: v.any() },
 *   handler: async ({ db, auth, session }, { arg1 }) => {...}
 * });
 * ```
 * @param func - Your function that can now take in a `session` in the ctx param.
 * @returns A Convex serverless function.
 */
export function mutationWithSession<ArgsValidator extends PropertyValidators, Output>(
  func: ValidatedFunction<
    MutationCtx & { session: Doc<'sessions'> },
    ArgsValidator,
    Promise<Output>
  >,
): RegisteredMutation<
  'public',
  ObjectType<ArgsValidator> & ObjectType<typeof SessionMiddlewareValidator>,
  Output
>;
export function mutationWithSession<Args extends ArgsArray, Output>(
  func: UnvalidatedFunction<MutationCtx & { session: Doc<'sessions'> }, Args, Promise<Output>>,
): RegisteredMutation<
  'public',
  MergeArgsForRegistered<Args, ObjectType<typeof SessionMiddlewareValidator>>,
  Output
>;
export function mutationWithSession(func: any): any {
  return mutation(withSession(func));
}
/**
 * Wrapper for a Convex query function that provides a session in ctx.
 *
 * Requires an `Id<"sessions">` or null as the first parameter. This is provided by
 * default by using {@link useSessionQuery}. It validates and strips this
 * parameter for you.
 * E.g.:
 * ```ts
 * export default queryWithSession({
 *   args: { arg1: v.any() },
 *   handler: async ({ db, auth, session }, { arg1 }) => {...}
 * });
 * ```
 * If the session isn't initialized yet, it will pass null.
 * @param func - Your function that can now take in a `session` in the ctx param.
 * @returns A Convex serverless function.
 */
export function queryWithSession<ArgsValidator extends PropertyValidators, Output>(
  func: ValidatedFunction<
    QueryCtx & { session: Doc<'sessions'> | null },
    ArgsValidator,
    Promise<Output>
  >,
): RegisteredQuery<
  'public',
  ObjectType<ArgsValidator> & ObjectType<typeof OptionalSessionMiddlewareValidator>,
  Output
>;
export function queryWithSession<Args extends ArgsArray, Output>(
  func: UnvalidatedFunction<QueryCtx & { session: Doc<'sessions'> | null }, Args, Promise<Output>>,
): RegisteredQuery<
  'public',
  MergeArgsForRegistered<Args, ObjectType<typeof OptionalSessionMiddlewareValidator>>,
  Output
>;
export function queryWithSession(func: any): any {
  return query(withOptionalSession(func));
}
