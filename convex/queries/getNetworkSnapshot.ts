import { query } from "../_generated/server";
import { v } from "convex/values";
import { _requireAuth } from "../helpers/auth";

/**
 * getNetworkSnapshot — returns the latest pre-computed network snapshot.
 * O(1) read instead of aggregating all branchProducts.
 */
export const getNetworkSnapshot = query({
  args: {
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await _requireAuth(ctx);

    const date = args.date ?? new Date().toISOString().split("T")[0];

    const snapshot = await ctx.db
      .query("networkSnapshots")
      .withIndex("by_date", (q) => q.eq("date", date))
      .first();

    if (!snapshot) return null;

    // Also fetch branch rankings for this date
    const branchSnapshots = await ctx.db
      .query("branchSnapshots")
      .withIndex("by_date", (q) => q.eq("date", date))
      .collect();

    // Sort by rank
    branchSnapshots.sort((a, b) => a.rank - b.rank);

    return {
      ...snapshot,
      branchRankings: branchSnapshots.map((b) => ({
        branchId: b.branchId,
        branchName: b.branchName,
        totalProducts: b.totalProducts,
        totalBeg: b.totalBeg,
        totalSold: b.totalSold,
        totalSOH: b.totalSOH,
        sellThru: b.sellThru,
        slowMoverCount: b.slowMoverCount,
        fastMoverCount: b.fastMoverCount,
        midMoverCount: b.midMoverCount,
        rank: b.rank,
      })),
    };
  },
});
