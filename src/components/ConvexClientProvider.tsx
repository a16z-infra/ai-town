import { ReactNode } from 'react';
import { ConvexReactClient, ConvexProvider } from 'convex/react';
import { SessionProvider } from '../hooks/useServerSession';

/**
 * Determines the Convex deployment to use.
 *
 * We perform load balancing on the frontend, by randomly selecting one of the available instances.
 * We use localStorage so that individual users stay on the same instance.
 */
function convexUrl(): string {
  const url = import.meta.env.VITE_CONVEX_URL as string;
  if (!url) {
    throw new Error('Couldn’t find the Convex deployment URL.');
  }
  return url;
}

const convex = new ConvexReactClient(convexUrl(), { unsavedChangesWarning: false });

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  // We waitForSessionId since we also mount the session provider in the Game
  // and we don't want to have them both inventing sessionIds for themselves.
  return (
    <ConvexProvider client={convex}>
      <SessionProvider waitForSessionId>{children}</SessionProvider>
    </ConvexProvider>
  );
}
