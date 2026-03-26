import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/no-role(.*)",
  "/feedback/submit(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Public routes pass through (sign-in, sign-up, no-role, public feedback form)
  if (isPublicRoute(req)) return;

  const { userId } = await auth();

  // Unauthenticated users → redirect to sign-in
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Authenticated users pass through — role enforcement handled by
  // Convex _requireAuth server-side (reads role from users table, not JWT claims).
  // This works with the Convex JWT template which doesn't include publicMetadata.
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
