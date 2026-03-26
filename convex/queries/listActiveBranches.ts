import { query } from "../_generated/server";
import { _requireAuth } from "../helpers/auth";
import { ConvexError } from "convex/values";

/**
 * listActiveBranches — returns all active branches.
 * Accessible by: Branch Manager, Admin
 * Branch Staff: blocked (no business need to enumerate branches)
 */
export const listActiveBranches = query({
  args: {},
  handler: async (ctx) => {
    const auth = await _requireAuth(ctx);
    if (auth.role === "Branch Staff") {
      throw new ConvexError("Forbidden: Branch Staff cannot list branches");
    }
    return await ctx.db
      .query("branches")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();
  },
});
