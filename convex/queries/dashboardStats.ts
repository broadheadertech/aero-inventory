import { query } from "../_generated/server";
import { _requireAuth } from "../helpers/auth";
import { _calculateSellThru, _classify, _getThresholds } from "../helpers/sellThru";

export const dashboardStats = query({
  args: {},
  handler: async (ctx) => {
    await _requireAuth(ctx);

    const products = await ctx.db.query("products").withIndex("by_isActive", (q) => q.eq("isActive", true)).collect();
    const branchProducts = await ctx.db.query("branchProducts").collect();
    const branches = await ctx.db.query("branches").collect();
    const thresholds = await _getThresholds(ctx, "weekly");

    const activeBranches = branches.filter((b) => b.isActive && b.type !== "warehouse").length;
    let totalSOH = 0;
    let totalBeg = 0;
    let totalSold = 0;
    let fastCount = 0;
    let midCount = 0;
    let slowCount = 0;

    for (const bp of branchProducts) {
      totalSOH += bp.currentSOH;
      totalBeg += bp.beginningStock;
      const result = _calculateSellThru(bp.beginningStock, bp.currentSOH);
      if (result) {
        totalSold += result.sold;
        const cls = _classify(result.sellThruPercent, thresholds.fastThreshold, thresholds.slowThreshold);
        if (cls === "Fast") fastCount++;
        else if (cls === "Mid") midCount++;
        else slowCount++;
      }
    }

    const networkSellThru = totalBeg > 0 ? (totalSold / totalBeg) * 100 : 0;
    const totalSOHValue = branchProducts.reduce((sum, bp) => {
      const product = products.find((p) => p._id === bp.productId);
      return sum + bp.currentSOH * (product?.retailPrice ?? 0);
    }, 0);

    return {
      totalProducts: products.length,
      activeBranches,
      totalSOH,
      totalSOHValue,
      networkSellThru: Math.round(networkSellThru * 10) / 10,
      fastCount,
      midCount,
      slowCount,
      totalBranchProducts: branchProducts.length,
    };
  },
});
