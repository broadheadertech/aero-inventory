import { query } from "../_generated/server";

/**
 * Get current authenticated user's role from Convex users table.
 * Returns null if user not found (not yet synced).
 * Does NOT throw — used by root page for routing.
 */
export const getCurrentUserRole = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    return user?.role ?? null;
  },
});
