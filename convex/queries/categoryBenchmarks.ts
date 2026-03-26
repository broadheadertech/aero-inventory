import { query } from "../_generated/server";
import { v } from "convex/values";
import { _requireAuth } from "../helpers/auth";

export const categoryBenchmarks = query({
  args: {
    branchId: v.id("branches"),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);

    const branch = await ctx.db.get(args.branchId);
    if (!branch) return null;

    const allProducts = await ctx.db.query("products").collect();
    const categories = [...new Set(allProducts.map((p) => p.category))].sort();
    const allBranches = await ctx.db.query("branches").collect();

    // M1+M2 fix: Pre-fetch ALL branchProducts once, group by branchId
    const allBranchProducts = await ctx.db.query("branchProducts").collect();
    const bpByBranch = new Map<string, typeof allBranchProducts>();
    for (const bp of allBranchProducts) {
      const list = bpByBranch.get(bp.branchId) ?? [];
      list.push(bp);
      bpByBranch.set(bp.branchId, list);
    }

    // Build product-to-category map
    const productCategory = new Map<string, string>();
    for (const p of allProducts) {
      productCategory.set(p._id, p.category);
    }

    const myBranchProducts = bpByBranch.get(args.branchId) ?? [];

    const results = categories.map((category) => {
      const categoryProductIds = new Set(
        allProducts.filter((p) => p.category === category).map((p) => p._id)
      );

      if (categoryProductIds.size === 0) return null;

      // This branch's performance
      const myFiltered = myBranchProducts.filter((bp) => categoryProductIds.has(bp.productId));
      const myBeginning = myFiltered.reduce((sum, bp) => sum + (bp.beginningStock ?? 0), 0);
      const mySold = myFiltered.reduce((sum, bp) => sum + Math.max(0, (bp.beginningStock ?? 0) - (bp.currentSOH ?? 0)), 0);
      const mySellThru = myBeginning > 0 ? (mySold / myBeginning) * 100 : 0;

      // Network performance — iterate in-memory data, no extra queries
      let networkBeginning = 0;
      let networkSold = 0;
      let topBranchName = "";
      let topBranchSellThru = 0;

      for (const b of allBranches) {
        const bps = bpByBranch.get(b._id) ?? [];
        const filtered = bps.filter((bp) => categoryProductIds.has(bp.productId));
        const beg = filtered.reduce((sum, bp) => sum + (bp.beginningStock ?? 0), 0);
        const sold = filtered.reduce((sum, bp) => sum + Math.max(0, (bp.beginningStock ?? 0) - (bp.currentSOH ?? 0)), 0);

        networkBeginning += beg;
        networkSold += sold;

        const branchSellThru = beg > 0 ? (sold / beg) * 100 : 0;
        if (branchSellThru > topBranchSellThru) {
          topBranchSellThru = branchSellThru;
          topBranchName = b.name;
        }
      }

      const networkAvg = networkBeginning > 0 ? (networkSold / networkBeginning) * 100 : 0;
      const delta = mySellThru - networkAvg;
      const isImprovementOpportunity = delta < -10;

      return {
        category,
        mySellThru: Math.round(mySellThru * 100) / 100,
        networkAvg: Math.round(networkAvg * 100) / 100,
        delta: Math.round(delta * 100) / 100,
        isImprovementOpportunity,
        productCount: myFiltered.length,
        topPerformer: {
          branchName: topBranchName,
          sellThru: Math.round(topBranchSellThru * 100) / 100,
        },
      };
    });

    const filtered = results.filter(Boolean) as NonNullable<(typeof results)[number]>[];

    return {
      branchName: branch.name,
      categories: filtered,
      improvementCount: filtered.filter((r) => r.isImprovementOpportunity).length,
    };
  },
});
