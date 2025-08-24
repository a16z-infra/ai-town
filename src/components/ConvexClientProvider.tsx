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
function convexUrl(): string | null {
  const url = import.meta.env.VITE_CONVEX_URL as string;
  return url || null;
}

// Create a ConvexClientProvider that handles missing deployment URL gracefully
function ConvexClientProviderContent({ children }: { children: ReactNode }) {
  const url = convexUrl();
  
  if (!url) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black text-white">
        <div className="max-w-2xl p-8 text-center">
          <h1 className="text-4xl font-bold mb-6 text-red-400">⚠️ Configuration Required</h1>
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Missing Convex Deployment URL</h2>
            <p className="text-gray-300 mb-4">
              This AI Town application requires a Convex backend to function. To set up your own deployment:
            </p>
            <ol className="text-left text-gray-300 space-y-2 mb-6">
              <li>1. Clone this repository</li>
              <li>2. Set up a Convex account at <a href="https://convex.dev" className="text-blue-400 hover:underline">convex.dev</a></li>
              <li>3. Deploy the backend using <code className="bg-gray-700 px-2 py-1 rounded">npx convex deploy</code></li>
              <li>4. Set the <code className="bg-gray-700 px-2 py-1 rounded">VITE_CONVEX_URL</code> environment variable</li>
            </ol>
          </div>
          <div className="space-y-4">
            <a 
              href="https://www.convex.dev/ai-town" 
              className="inline-block bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              🎮 Try the Live Demo
            </a>
            <div className="text-sm text-gray-400">
              <a href="https://github.com/a16z-infra/ai-town" className="hover:text-white hover:underline">
                📖 View Setup Instructions on GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const convex = new ConvexReactClient(url, { unsavedChangesWarning: false });

  return (
    // <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string}>
    // <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
    <ConvexProvider client={convex}>{children}</ConvexProvider>
    // </ConvexProviderWithClerk>
    // </ClerkProvider>
  );
}

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexClientProviderContent>{children}</ConvexClientProviderContent>;
}