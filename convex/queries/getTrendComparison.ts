import { query } from "../_generated/server";
import { v } from "convex/values";
import { _requireAuth } from "../helpers/auth";
import {
  _computeTrendData,
  _computeCategoryAverage,
  _getDateRangeForPeriod,
  type ComparisonTrendData,
} from "../helpers/trendCalculation";

/**
 * getTrendComparison — returns a product's trend alongside its category average.
 * Admin sees all branches; Branch Manager sees only their branch.
 */
export const getTrendComparison = query({
  args: {
    productId: v.id("products"),
    branchId: v.optional(v.id("branches")),
    period: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<ComparisonTrendData> => {
    const auth = await _requireAuth(ctx);
    const period = args.period ?? "1m";
    const startDate = _getDateRangeForPeriod(period);

    // Get the target product to find its department + category
    const product = await ctx.db.get(args.productId);
    if (!product) {
      return { productTrend: [], categoryAvgTrend: [] };
    }

    // Determine branch filter
    let branchIds: string[] = [];
    if (auth.role === "Admin") {
      if (args.branchId) branchIds = [args.branchId];
    } else {
      branchIds = auth.branchIds as string[];
    }

    // Get all products in same department + category
    const categoryProducts = await ctx.db
      .query("products")
      .withIndex("by_department", (q) => q.eq("department", product.department))
      .collect();
    const sameCategoryProducts = categoryProducts.filter(
      (p) => p.category === product.category
    );

    // Get all sales entries in date range
    let allEntries = await ctx.db
      .query("salesEntries")
      .withIndex("by_enteredAt")
      .filter((q) => q.gte(q.field("enteredAt"), startDate))
      .collect();

    if (branchIds.length > 0) {
      allEntries = allEntries.filter((e) => branchIds.includes(e.branchId));
    }

    // Get branchProducts for BEG values
    const bpIds = [...new Set(allEntries.map((e) => e.branchProductId))];
    const bpResults = await Promise.all(bpIds.map((id) => ctx.db.get(id)));
    const allBranchProducts = bpResults.filter(Boolean) as NonNullable<typeof bpResults[number]>[];

    // Pre-group entries and branchProducts by productId for O(n) lookup
    const entriesByProduct = new Map<string, typeof allEntries>();
    for (const entry of allEntries) {
      const list = entriesByProduct.get(entry.productId) ?? [];
      list.push(entry);
      entriesByProduct.set(entry.productId, list);
    }
    const bpsByProduct = new Map<string, typeof allBranchProducts>();
    for (const bp of allBranchProducts) {
      const list = bpsByProduct.get(bp.productId) ?? [];
      list.push(bp);
      bpsByProduct.set(bp.productId, list);
    }

    // Compute product trend
    const productTrend = _computeTrendData(
      entriesByProduct.get(args.productId) ?? [],
      bpsByProduct.get(args.productId) ?? [],
      period
    );

    // Compute category average trend (all products in same dept+category)
    const categoryTrends = sameCategoryProducts.map((p) =>
      _computeTrendData(
        entriesByProduct.get(p._id) ?? [],
        bpsByProduct.get(p._id) ?? [],
        period
      )
    );
    const categoryAvgTrend = _computeCategoryAverage(categoryTrends);

    return { productTrend, categoryAvgTrend };
  },
});
