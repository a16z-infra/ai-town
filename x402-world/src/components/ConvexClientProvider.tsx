import { ReactNode } from 'react';
import { ConvexReactClient, ConvexProvider } from 'convex/react';

/**
 * Determines the Convex deployment to use.
 */
function convexUrl(): string {
  const url = import.meta.env.VITE_CONVEX_URL as string;
  if (!url) {
    throw new Error(
      'Couldn\'t find the Convex deployment URL. Make sure VITE_CONVEX_URL is set in .env.local'
    );
  }
  return url;
}

const convex = new ConvexReactClient(convexUrl(), { unsavedChangesWarning: false });

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
