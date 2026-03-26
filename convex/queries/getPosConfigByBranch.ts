import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

export const getPosConfigByBranch = internalQuery({
  args: { branchIdentifier: v.string() },
  handler: async (ctx, args) => {
    // Try as branch ID first (most common case)
    const branches = await ctx.db.query("branches").collect();
    const branch = branches.find(
      (b) => b._id === args.branchIdentifier || b.name === args.branchIdentifier || b.code === args.branchIdentifier
    );

    if (!branch) return null;

    // Use index for efficient lookup (L1 fix)
    const config = await ctx.db
      .query("posConfig")
      .withIndex("by_branchId", (q) => q.eq("branchId", branch._id))
      .first();

    return config;
  },
});
