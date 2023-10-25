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
import { Id } from '../../convex/_generated/dataModel';
import { FunctionReference, OptionalRestArgs } from 'convex/server';
import { api } from '../../convex/_generated/api';
import { useQuery, useMutation } from 'convex/react';

// TODO: parametrize by storage key, where to store, type of id

const SessionContext = React.createContext<Id<'sessions'> | null>(null);

/**
 * Context for a Convex session, creating a server session and providing the id.
 *
 * @param props - Where you want your session ID to be persisted. Roughly:
 *  - sessionStorage is saved per-tab
 *  - localStorage is shared between tabs, but not browser profiles.
 * @returns A provider to wrap your React nodes which provides the session ID.
 * To be used with useSessionQuery and useSessionMutation.
 */
export const SessionProvider: React.FC<{
  storageLocation?: 'localStorage' | 'sessionStorage';
  storageKey?: string;
  children?: React.ReactNode;
}> = ({ storageLocation, children, storageKey }) => {
  const store =
    // If it's rendering in SSR or such.
    typeof window === 'undefined' ? null : window[storageLocation ?? 'sessionStorage'];
  const storeKey = storageKey ?? 'convex-session-id';
  const [sessionId, setSession] = useState<Id<'sessions'> | null>(null);
  const createOrValidateSession = useMutation(api.auth.createOrValidateSession);

  // Get or set the ID from our desired storage location.
  useEffect(() => {
    const stored = store?.getItem(storeKey) ?? null;
    createOrValidateSession({ sessionId: stored }).then((sessionId) => {
      setSession(sessionId);
      if (sessionId !== stored) {
        store?.setItem(storeKey, sessionId);
      }
    });
  }, [createOrValidateSession, store]);

  return React.createElement(SessionContext.Provider, { value: sessionId }, children);
};

type SessionFunction<Args extends any> = FunctionReference<
  'query' | 'mutation',
  'public',
  { sessionId: Id<'sessions'> | null } & Args,
  any
>;

type SessionQueryArgsArray<Fn extends SessionFunction<any>> = keyof Fn['_args'] extends 'sessionId'
  ? [args?: EmptyObject | 'skip']
  : [args: BetterOmit<Fn['_args'], 'sessionId'> | 'skip'];

// Like useQuery, but for a Query that takes a session ID.
export function useSessionQuery<
  Query extends FunctionReference<'query', 'public', { sessionId: Id<'sessions'> | null }, any>,
>(query: Query, ...args: SessionQueryArgsArray<Query>): Query['_returnType'] | undefined {
  const skip = args[0] === 'skip';
  const sessionId = useContext(SessionContext);
  const originalArgs = args[0] === 'skip' ? {} : args[0] ?? {};

  const newArgs = skip ? 'skip' : { ...originalArgs, sessionId };

  return useQuery(query, ...([newArgs] as OptionalRestArgs<Query>));
}

type SessionMutationArgsArray<Fn extends SessionFunction<any>> =
  keyof Fn['_args'] extends 'sessionId' ? [] : [args: BetterOmit<Fn['_args'], 'sessionId'>];

// Like useMutation, but for a Mutation that takes a session ID.
export const useSessionMutation = <
  Mutation extends FunctionReference<'mutation', 'public', { sessionId: Id<'sessions'> }, any>,
>(
  name: Mutation,
) => {
  const sessionId = useContext(SessionContext);
  const originalMutation = useMutation(name);

  return (...args: SessionMutationArgsArray<Mutation>): Promise<Mutation['_returnType']> => {
    const newArgs = { ...(args[0] ?? {}), sessionId } as Mutation['_args'];

    return originalMutation(...([newArgs] as OptionalRestArgs<Mutation>));
  };
};

// Type utils:
type EmptyObject = Record<string, never>;

/**
 * An `Omit<>` type that:
 * 1. Applies to each element of a union.
 * 2. Preserves the index signature of the underlying type.
 */
declare type BetterOmit<T, K extends keyof T> = {
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
export type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
  ? true
  : false;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function assert<T extends true>() {
  // no need to do anything! we're just asserting at compile time that the type
  // parameter is true.
}

assert<
  Equals<
    SessionQueryArgsArray<
      FunctionReference<'query', 'public', { arg: string; sessionId: Id<'sessions'> | null }, any>
    >,
    [{ arg: string } | 'skip']
  >
>();
assert<
  Equals<
    SessionQueryArgsArray<
      FunctionReference<'query', 'public', { sessionId: Id<'sessions'> | null }, any>
    >,
    [args?: EmptyObject | 'skip' | undefined]
  >
>();
assert<
  Equals<
    SessionMutationArgsArray<
      FunctionReference<
        'mutation',
        'public',
        { arg: string; sessionId: Id<'sessions'> | null },
        any
      >
    >,
    [{ arg: string }]
  >
>();
assert<
  Equals<
    SessionMutationArgsArray<
      FunctionReference<'query', 'public', { sessionId: Id<'sessions'> | null }, any>
    >,
    []
  >
>();
