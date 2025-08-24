import { ReactNode } from 'react';
import { ConvexReactClient, ConvexProvider } from 'convex/react';
// import { ConvexProviderWithClerk } from 'convex/react-clerk';
// import { ClerkProvider, useAuth } from '@clerk/clerk-react';

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
  return (
    // <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string}>
    // <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
    <ConvexProvider client={convex}>{children}</ConvexProvider>
    // </ConvexProviderWithClerk>
    // </ClerkProvider>
  );
}
