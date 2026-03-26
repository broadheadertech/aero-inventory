import { query } from "../_generated/server";
import { v } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";
import { _computeTrendData, _getDateRangeForPeriod } from "../helpers/trendCalculation";
import { computeTrajectoryFromDelta } from "../../lib/utils/trajectory";

export type DecliningProduct = {
  productId: string;
  styleCode: string;
  name: string;
  department: string;
  category: string;
  imageUrl: string | null;
  currentSellThru: number;
  previousSellThru: number;
  delta: number;
  trajectory: "fast" | "mid" | "slow" | "stable";
};

/**
 * getDecliningSellThru — returns products with declining sell-thru velocity.
 * Admin only. Sorted by decline severity (largest negative delta first).
 */
export const getDecliningSellThru = query({
  args: {
    branchId: v.optional(v.id("branches")),
    period: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<DecliningProduct[]> => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const period = args.period ?? "1m";
    const startDate = _getDateRangeForPeriod(period);

    // Get all sales entries in date range
    let entries = await ctx.db
      .query("salesEntries")
      .withIndex("by_enteredAt")
      .filter((q) => q.gte(q.field("enteredAt"), startDate))
      .collect();

    // Filter by branch if specified
    if (args.branchId) {
      entries = entries.filter((e) => e.branchId === args.branchId);
    }

    if (entries.length === 0) return [];

    // Get all active products
    const products = await ctx.db
      .query("products")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    // Get branchProducts for BEG values
    const bpIds = [...new Set(entries.map((e) => e.branchProductId))];
    const bpResults = await Promise.all(bpIds.map((id) => ctx.db.get(id)));
    const allBPs = bpResults.filter(Boolean) as NonNullable<typeof bpResults[number]>[];

    // Pre-group entries and BPs by productId
    const entriesByProduct = new Map<string, typeof entries>();
    for (const entry of entries) {
      const list = entriesByProduct.get(entry.productId) ?? [];
      list.push(entry);
      entriesByProduct.set(entry.productId, list);
    }
    const bpsByProduct = new Map<string, typeof allBPs>();
    for (const bp of allBPs) {
      const list = bpsByProduct.get(bp.productId) ?? [];
      list.push(bp);
      bpsByProduct.set(bp.productId, list);
    }

    // Compute trend for each product and find declining ones
    const declining: DecliningProduct[] = [];

    for (const product of products) {
      const pEntries = entriesByProduct.get(product._id);
      if (!pEntries || pEntries.length === 0) continue;

      const pBPs = bpsByProduct.get(product._id) ?? [];
      const trend = _computeTrendData(pEntries, pBPs, period);

      if (trend.length < 2) continue;

      const latest = trend[trend.length - 1].sellThruPercent;
      const previous = trend[trend.length - 2].sellThruPercent;
      const delta = Math.round((latest - previous) * 100) / 100;

      const trajectory = computeTrajectoryFromDelta(delta, latest);

      // Include products with any negative delta
      if (delta < 0) {
        declining.push({
          productId: product._id,
          styleCode: product.styleCode,
          name: product.name,
          department: product.department,
          category: product.category,
          imageUrl: product.imageUrl ?? null,
          currentSellThru: latest,
          previousSellThru: previous,
          delta,
          trajectory,
        });
      }
    }

    // Sort by severity (most negative delta first)
    declining.sort((a, b) => a.delta - b.delta);

    return declining;
  },
});
