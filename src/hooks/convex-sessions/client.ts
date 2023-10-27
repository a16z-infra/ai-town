/**
 * React helpers for adding session data to Convex functions.
 *
 * !Important!: To use these functions, you must wrap your code with
 * ```tsx
 *  <ConvexProvider client={convex}>
 *    <SessionProvider storageLocation={"sessionStorage"}>
 *      <App />
 *    </SessionProvider>
 *  </ConvexProvider>
 * ```
 *
 * With the `SessionProvider` inside the `ConvexProvider` but outside your app.
 *
 * Note: If you are rendering your app in StrictMode, you may generate
 * two sessionIds on the first load.
 */
import React, { useContext, useEffect, useState } from 'react';
import { FunctionReference, OptionalRestArgs } from 'convex/server';
import { useQuery, useMutation } from 'convex/react';
import { GenericId } from 'convex/values';

export function makeUseSessionHooks<SessionId extends GenericId<any>>(
  createOrValidateSession: FunctionReference<
    'mutation',
    'public',
    {
      sessionId: string | null;
    },
    SessionId
  >,
  storageKey?: string,
  storageLocation?: 'localStorage' | 'sessionStorage',
) {
  const SessionContext = React.createContext<SessionId | null>(null);

  type SessionFunction<Args extends any> = FunctionReference<
    'query' | 'mutation',
    'public',
    { sessionId: SessionId | null } & Args,
    any
  >;
  type SessionQueryArgsArray<Fn extends SessionFunction<any>> =
    keyof Fn['_args'] extends 'sessionId'
      ? [args?: EmptyObject | 'skip']
      : [args: BetterOmit<Fn['_args'], 'sessionId'> | 'skip'];

  type SessionMutationArgsArray<Fn extends SessionFunction<any>> =
    keyof Fn['_args'] extends 'sessionId' ? [] : [args: BetterOmit<Fn['_args'], 'sessionId'>];
  /**
   * Context for a Convex session, creating a server session and providing the id.
   *
   * @param props - Where you want your session ID to be persisted. Roughly:
   *  - sessionStorage is saved per-tab
   *  - localStorage is shared between tabs, but not browser profiles.
   * @returns A provider to wrap your React nodes which provides the session ID.
   * To be used with useSessionQuery and useSessionMutation.
   */
  const SessionProvider: React.FC<{
    waitForSessionId?: boolean;
    children?: React.ReactNode;
  }> = ({ waitForSessionId, children }) => {
    const store =
      // If it's rendering in SSR or such.
      typeof window === 'undefined' ? null : window[storageLocation ?? 'sessionStorage'];
    const storeKey = storageKey ?? 'convex-session-id';
    const [sessionId, setSession] = useState<SessionId | null>(null);
    const createOrValidate = useMutation(createOrValidateSession);

    // Get or set the ID from our desired storage location.
    useEffect(() => {
      const stored = store?.getItem(storeKey) ?? null;
      createOrValidate({ sessionId: stored }).then((sessionId) => {
        setSession(sessionId);
        if (sessionId !== stored) {
          store?.setItem(storeKey, sessionId);
        }
      });
    }, [createOrValidate, store]);

    return React.createElement(
      SessionContext.Provider,
      { value: sessionId },
      waitForSessionId && !sessionId ? null : children,
    );
  };

  // Like useQuery, but for a Query that takes a session ID.
  function useSessionQuery<
    Query extends FunctionReference<'query', 'public', { sessionId: SessionId | null }, any>,
  >(query: Query, ...args: SessionQueryArgsArray<Query>): Query['_returnType'] | undefined {
    const skip = args[0] === 'skip';
    const sessionId = useContext(SessionContext);
    const originalArgs = args[0] === 'skip' ? {} : args[0] ?? {};

    const newArgs = skip ? 'skip' : { ...originalArgs, sessionId };

    return useQuery(query, ...([newArgs] as OptionalRestArgs<Query>));
  }

  // Like useMutation, but for a Mutation that takes a session ID.
  function useSessionMutation<
    Mutation extends FunctionReference<'mutation', 'public', { sessionId: SessionId }, any>,
  >(name: Mutation) {
    const sessionId = useContext(SessionContext);
    const originalMutation = useMutation(name);

    return (...args: SessionMutationArgsArray<Mutation>): Promise<Mutation['_returnType']> => {
      const newArgs = { ...(args[0] ?? {}), sessionId } as Mutation['_args'];

      return originalMutation(...([newArgs] as OptionalRestArgs<Mutation>));
    };
  }

  return { SessionProvider, useSessionQuery, useSessionMutation };

  // Type utils:
  type EmptyObject = Record<string, never>;

  /**
   * An `Omit<>` type that:
   * 1. Applies to each element of a union.
   * 2. Preserves the index signature of the underlying type.
   */
  type BetterOmit<T, K extends keyof T> = {
    [Property in keyof T as Property extends K ? never : Property]: T[Property];
  };

  /**
   * TESTS
   */
  /**
   * Tests if two types are exactly the same.
   * Taken from https://github.com/Microsoft/TypeScript/issues/27024#issuecomment-421529650
   * (Apache Version 2.0, January 2004)
   */
  type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function assert<T extends true>() {
    // no need to do anything! we're just asserting at compile time that the type
    // parameter is true.
  }

  assert<
    Equals<
      SessionQueryArgsArray<
        FunctionReference<'query', 'public', { arg: string; sessionId: SessionId | null }, any>
      >,
      [{ arg: string } | 'skip']
    >
  >();
  assert<
    Equals<
      SessionQueryArgsArray<
        FunctionReference<'query', 'public', { sessionId: SessionId | null }, any>
      >,
      [args?: EmptyObject | 'skip' | undefined]
    >
  >();
  assert<
    Equals<
      SessionMutationArgsArray<
        FunctionReference<'mutation', 'public', { arg: string; sessionId: SessionId | null }, any>
      >,
      [{ arg: string }]
    >
  >();
  assert<
    Equals<
      SessionMutationArgsArray<
        FunctionReference<'query', 'public', { sessionId: SessionId | null }, any>
      >,
      []
    >
  >();
}
