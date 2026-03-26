import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";

const VALID_ROLES = ["Admin", "Branch Manager", "Branch Staff"] as const;

/**
 * Demo-only: switch current user's role for testing all 3 views.
 * When switching to Branch Manager or Staff, a specific branch can be selected.
 * In production, this would be removed or restricted.
 */
export const switchRole = mutation({
  args: {
    role: v.string(),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    if (!VALID_ROLES.includes(args.role as typeof VALID_ROLES[number])) {
      throw new ConvexError("Invalid role");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!user) throw new ConvexError("User not found");

    // Determine branch assignment
    let branchIds = user.branchIds;
    if (args.role !== "Admin") {
      if (args.branchId) {
        // Use the specifically selected branch
        branchIds = [args.branchId];
      } else if (branchIds.length === 0) {
        // Fallback: assign first branch
        const firstBranch = await ctx.db
          .query("branches")
          .filter((q) => q.neq(q.field("type"), "warehouse"))
          .first();
        if (firstBranch) {
          branchIds = [firstBranch._id];
        }
      }
    }

    await ctx.db.patch(user._id, {
      role: args.role as typeof VALID_ROLES[number],
      branchIds,
      updatedAt: new Date().toISOString(),
    });

    return { role: args.role, branchIds };
  },
});
