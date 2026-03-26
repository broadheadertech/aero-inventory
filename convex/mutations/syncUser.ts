import { mutation } from "../_generated/server";
import { ConvexError } from "convex/values";

const VALID_ROLES = [
  "Admin",
  "Branch Manager",
  "Branch Staff",
] as const;
type Role = (typeof VALID_ROLES)[number];

/**
 * syncUser — Clerk → Convex user sync mutation.
 *
 * Called from <SyncUser /> client component after Clerk authentication.
 * Idempotent: returns existing _id if user already exists.
 *
 * Uses Convex JWT template from Clerk — no custom session token needed.
 * First user created is auto-assigned Admin role.
 * Subsequent users default to "Branch Staff" — Admin can change role via Users page.
 */
export const syncUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const clerkUserId = identity.subject;

    // Idempotent: return existing user if already synced
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
      .unique();

    if (existingUser) {
      return existingUser._id;
    }

    // Check if this is the first user — auto-assign Admin
    const allUsers = await ctx.db.query("users").take(1);
    const isFirstUser = allUsers.length === 0;
    const role: Role = isFirstUser ? "Admin" : "Branch Staff";

    const now = new Date().toISOString();

    return await ctx.db.insert("users", {
      clerkUserId,
      email: identity.email ?? "",
      name: identity.name ?? identity.email ?? clerkUserId,
      role,
      branchIds: [],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});
