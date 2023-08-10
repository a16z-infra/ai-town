import { authMiddleware } from '@clerk/nextjs';

// This requires user to sign in to see any page or call any API route

export default authMiddleware({
  // TODO: require Clerk login.
  publicRoutes: ['/'],
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
