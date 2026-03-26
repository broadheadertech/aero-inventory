import { query } from "../_generated/server";
import { v } from "convex/values";
import { _requireAuth } from "../helpers/auth";
import { _computeTrendData, _getDateRangeForPeriod } from "../helpers/trendCalculation";

/**
 * getTrendData — returns sell-thru trend data points for charting.
 * Admin sees all branches; Branch Manager sees only their branch.
 * Data aggregated by day (short periods) or week (3m/6m).
 */
export const getTrendData = query({
  args: {
    branchId: v.optional(v.id("branches")),
    period: v.optional(v.string()),
    department: v.optional(v.string()),
    category: v.optional(v.string()),
    collection: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    const period = args.period ?? "1m";
    const startDate = _getDateRangeForPeriod(period);

    // Determine branch filter
    let branchIds: string[] = [];
    if (auth.role === "Admin") {
      if (args.branchId) {
        branchIds = [args.branchId];
      }
      // If no branchId, get all entries (network view)
    } else {
      // Branch Manager: restricted to their branches
      branchIds = auth.branchIds as string[];
    }

    // Get sales entries within date range
    let entries = await ctx.db
      .query("salesEntries")
      .withIndex("by_enteredAt")
      .filter((q) => q.gte(q.field("enteredAt"), startDate))
      .collect();

    // Filter by branch if specified
    if (branchIds.length > 0) {
      entries = entries.filter((e) => branchIds.includes(e.branchId));
    }

    // Filter by product attributes using indexes where possible
    if (args.department || args.category || args.collection) {
      let products;
      if (args.department) {
        products = await ctx.db
          .query("products")
          .withIndex("by_department", (q) => q.eq("department", args.department!))
          .collect();
      } else if (args.category) {
        products = await ctx.db
          .query("products")
          .withIndex("by_category", (q) => q.eq("category", args.category!))
          .collect();
      } else {
        products = await ctx.db
          .query("products")
          .withIndex("by_collection", (q) => q.eq("collection", args.collection!))
          .collect();
      }
      // Apply remaining filters in memory
      const productIds = new Set<string>();
      for (const p of products) {
        if (args.category && p.category !== args.category) continue;
        if (args.collection && p.collection !== args.collection) continue;
        productIds.add(p._id);
      }
      entries = entries.filter((e) => productIds.has(e.productId));
    }

    // Get branchProducts for BEG values — batch load via Promise.all
    const bpIds = [...new Set(entries.map((e) => e.branchProductId))];
    const bpResults = await Promise.all(bpIds.map((id) => ctx.db.get(id)));
    const branchProducts = bpResults.filter(Boolean) as NonNullable<typeof bpResults[number]>[];

    return _computeTrendData(entries, branchProducts, period);
  },
});
