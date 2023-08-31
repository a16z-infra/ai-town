import { ReactNode } from 'react';
import { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from '@clerk/clerk-react';


/**
 * Determines the Convex deployment to use.
 *
 * We perform load balancing on the frontend, by randomly selecting one of the available instances.
 * We use localStorage so that individual users stay on the same instance.
 */
function convexUrl(): string {
  const urlsString = import.meta.env.VITE_CONVEX_URLS as string;
  if (!urlsString) {
    const url = import.meta.env.VITE_CONVEX_URL as string;
    if (!url) {
      throw new Error('Couldn’t find the Convex deployment URL.');
    }
    return url;
  }

  const urls = urlsString.split('\n');
  const activeUrl = window.localStorage?.getItem('convexDeploymentUrl');
  if (activeUrl && urls.includes(activeUrl)) {
    return activeUrl;
  }

  const newUrl = urls[Math.floor(Math.random() * urls.length)].trim();
  window.localStorage?.setItem('convexDeploymentUrl', newUrl);
  return newUrl;
}

const convex = new ConvexReactClient(convexUrl());

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string}>
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  </ClerkProvider>;
}
