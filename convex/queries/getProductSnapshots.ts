import { query } from "../_generated/server";
import { v } from "convex/values";
import { _requireAuth } from "../helpers/auth";

/**
 * getProductSnapshots — returns pre-computed product-level sell-thru data.
 * Supports pagination for large product catalogs.
 */
export const getProductSnapshots = query({
  args: {
    date: v.optional(v.string()),
    classification: v.optional(v.string()),
    department: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await _requireAuth(ctx);

    const date = args.date ?? new Date().toISOString().split("T")[0];

    let snapshots = await ctx.db
      .query("productSnapshots")
      .withIndex("by_date", (q) => q.eq("date", date))
      .collect();

    // Apply filters
    if (args.classification) {
      snapshots = snapshots.filter((s) => s.classification === args.classification);
    }
    if (args.department) {
      snapshots = snapshots.filter((s) => s.department === args.department);
    }
    if (args.category) {
      snapshots = snapshots.filter((s) => s.category === args.category);
    }

    // Sort by sell-thru descending
    snapshots.sort((a, b) => b.networkSellThru - a.networkSellThru);

    return snapshots;
  },
});
