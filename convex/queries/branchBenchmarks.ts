import { query } from "../_generated/server";
import { v } from "convex/values";
import { _requireAuth } from "../helpers/auth";

export const branchBenchmarks = query({
  args: {
    department: v.optional(v.string()),
    category: v.optional(v.string()),
    collection: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);

    const branches = await ctx.db.query("branches").collect();
    const allProducts = await ctx.db.query("products").collect();

    // Filter products by department/category/collection
    let filteredProductIds = new Set(allProducts.map((p) => p._id));
    if (args.department) {
      filteredProductIds = new Set(allProducts.filter((p) => p.department === args.department).map((p) => p._id));
    }
    if (args.category) {
      filteredProductIds = new Set(
        allProducts.filter((p) => filteredProductIds.has(p._id) && p.category === args.category).map((p) => p._id)
      );
    }
    if (args.collection) {
      filteredProductIds = new Set(
        allProducts.filter((p) => filteredProductIds.has(p._id) && p.collection === args.collection).map((p) => p._id)
      );
    }

    const rankings = await Promise.all(
      branches.map(async (branch) => {
        const branchProducts = await ctx.db
          .query("branchProducts")
          .withIndex("by_branchId", (q) => q.eq("branchId", branch._id))
          .collect();

        // Filter to matching products
        const filtered = branchProducts.filter((bp) => filteredProductIds.has(bp.productId));

        const totalBeginning = filtered.reduce((sum, bp) => sum + (bp.beginningStock ?? 0), 0);
        const totalSold = filtered.reduce((sum, bp) => sum + Math.max(0, (bp.beginningStock ?? 0) - (bp.currentSOH ?? 0)), 0);
        const sellThruPercent = totalBeginning > 0 ? (totalSold / totalBeginning) * 100 : 0;

        return {
          branchId: branch._id,
          branchName: branch.name,
          sellThruPercent: Math.round(sellThruPercent * 100) / 100,
          totalProducts: filtered.length,
          totalSold,
          totalBeginning,
        };
      })
    );

    // Sort by sell-thru descending and assign ranks
    const sorted = rankings
      .filter((r) => r.totalProducts > 0)
      .sort((a, b) => b.sellThruPercent - a.sellThruPercent);

    // Volume-weighted network average (M2 fix)
    const totalNetworkBeginning = sorted.reduce((sum, r) => sum + r.totalBeginning, 0);
    const totalNetworkSold = sorted.reduce((sum, r) => sum + r.totalSold, 0);
    const networkAvg = totalNetworkBeginning > 0
      ? (totalNetworkSold / totalNetworkBeginning) * 100
      : 0;

    const ranked = sorted.map((r, i) => ({
      ...r,
      rank: i + 1,
      deltaVsAvg: Math.round((r.sellThruPercent - networkAvg) * 100) / 100,
    }));

    // Get unique filter values for dropdowns
    const departments = [...new Set(allProducts.map((p) => p.department))].sort();
    const categories = [...new Set(allProducts.map((p) => p.category))].sort();
    const collections = [...new Set(allProducts.map((p) => p.collection))].sort();

    return {
      rankings: ranked,
      networkAvg: Math.round(networkAvg * 100) / 100,
      filters: { departments, categories, collections },
    };
  },
});
