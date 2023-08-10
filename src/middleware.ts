import { authMiddleware } from "@clerk/nextjs";

// This requires user to sign in to see any page or call any API route

// TODO - the public route list should only contain /api/text for production
export default authMiddleware({
  publicRoutes: ["/api(.*)"],
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
