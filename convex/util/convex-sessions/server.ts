/**
 * Allows you to persist state server-side, associated with a sessionId stored
 * on the client (in localStorage, e.g.). You wrap your mutation / query with
 * withSession or withOptionalSession and it passes in "session" in the "ctx"
 * (first parameter) argument to your function.
 *
 * There are two base wrappers:
 * - withSession
 * - withOptionalSession -- allows the sessionId to be null or a non-existent document and passes `session: null` if so
 * And two composed wrappers:
 * - mutationWithSession -- this defaults to requiring the sessionId
 * - queryWithSession -- this defaults to allowing a null sessionId
 */
import {
  ArgsArray,
  DocumentByName,
  GenericDataModel,
  GenericDatabaseReader,
  GenericMutationCtx,
  GenericQueryCtx,
  RegisteredMutation,
  RegisteredQuery,
  TableNamesInDataModel,
  UnvalidatedFunction,
  ValidatedFunction,
  mutationGeneric,
  queryGeneric,
} from 'convex/server';
import { GenericId, ObjectType, PropertyValidators, v } from 'convex/values';
import { MergeArgsForRegistered, generateMiddleware } from '../middlewareUtils';

export function makeSessionWrappers<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
>(sessionTable: TableName) {
  type SessionId = GenericId<TableName>;
  type SessionDoc = DocumentByName<DataModel, TableName>;
  type MutationCtx = GenericMutationCtx<DataModel>;
  type QueryCtx = GenericQueryCtx<DataModel>;
  type DatabaseReader = GenericDatabaseReader<DataModel>;
  /** -----------------------------------------------------------------
   * withSession
   * ----------------------------------------------------------------- */
  const SessionMiddlewareValidator = { sessionId: v.id(sessionTable) };
  const transformContextForSession = async <Ctx>(
    ctx: Ctx & { db: DatabaseReader },
    args: { sessionId: SessionId },
  ): Promise<Ctx & { session: SessionDoc }> => {
    const session = (await ctx.db.get(args.sessionId)) ?? null;
    if (session === null) {
      if (args.sessionId) {
        throw new Error(`Session ID is invalid. ${args.sessionId} not found`);
      }
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
   * Requires `sessionId` (type: SessionId) as a parameter.
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
  const withSession = generateMiddleware<
    { db: DatabaseReader },
    { session: SessionDoc },
    typeof SessionMiddlewareValidator
  >(SessionMiddlewareValidator, transformContextForSession);

  /** -----------------------------------------------------------------
   * withOptionalSession
   * ----------------------------------------------------------------- */
  const OptionalSessionMiddlewareValidator = {
    sessionId: v.union(v.null(), v.id(sessionTable)),
  };
  const transformContextForOptionalSession = async <Ctx>(
    ctx: Ctx & { db: DatabaseReader },
    args: ObjectType<typeof OptionalSessionMiddlewareValidator>,
  ): Promise<Ctx & { session: SessionDoc | null }> => {
    const session = args.sessionId ? await ctx.db.get(args.sessionId) : null;
    return { ...ctx, session };
  };

  /**
   * Wrapper for a Convex query or mutation function that provides a session in ctx.
   *
   * The session will be `null` if the sessionId passed up was null or invalid.
   * Requires `sessionId` (type: SessionId) as a parameter.
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
  const withOptionalSession = generateMiddleware<
    { db: DatabaseReader },
    { session: SessionDoc | null },
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
  function mutationWithSession<ArgsValidator extends PropertyValidators, Output>(
    func: ValidatedFunction<MutationCtx & { session: SessionDoc }, ArgsValidator, Promise<Output>>,
  ): RegisteredMutation<
    'public',
    ObjectType<ArgsValidator> & ObjectType<typeof SessionMiddlewareValidator>,
    Output
  >;
  function mutationWithSession<Args extends ArgsArray, Output>(
    func: UnvalidatedFunction<MutationCtx & { session: SessionDoc }, Args, Promise<Output>>,
  ): RegisteredMutation<
    'public',
    MergeArgsForRegistered<Args, ObjectType<typeof SessionMiddlewareValidator>>,
    Output
  >;
  function mutationWithSession(func: any): any {
    return mutationGeneric(withSession(func));
  }
  /**
   * Wrapper for a Convex query function that provides a session in ctx.
   *
   * Requires an `SessionId` or null as the first parameter. This is provided by
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
  function queryWithSession<ArgsValidator extends PropertyValidators, Output>(
    func: ValidatedFunction<
      QueryCtx & { session: SessionDoc | null },
      ArgsValidator,
      Promise<Output>
    >,
  ): RegisteredQuery<
    'public',
    ObjectType<ArgsValidator> & ObjectType<typeof OptionalSessionMiddlewareValidator>,
    Output
  >;
  function queryWithSession<Args extends ArgsArray, Output>(
    func: UnvalidatedFunction<QueryCtx & { session: SessionDoc | null }, Args, Promise<Output>>,
  ): RegisteredQuery<
    'public',
    MergeArgsForRegistered<Args, ObjectType<typeof OptionalSessionMiddlewareValidator>>,
    Output
  >;
  function queryWithSession(func: any): any {
    return queryGeneric(withOptionalSession(func));
  }

  return {
    SessionMiddlewareValidator,
    OptionalSessionMiddlewareValidator,
    withSession,
    withOptionalSession,
    queryWithSession,
    mutationWithSession,
  };
}
