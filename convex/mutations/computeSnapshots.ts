import { internalMutation } from "../_generated/server";

/**
 * computeSnapshots — pre-computes network, branch, and product-level sell-thru data.
 * Runs via cron daily (or on-demand). Stores results in snapshot tables
 * so dashboard reads are O(1) instead of O(branches * products).
 */
export const computeSnapshots = internalMutation({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0];
    const now = new Date().toISOString();

    // Fetch all data once
    const branches = await ctx.db.query("branches").collect();
    const products = await ctx.db.query("products").collect();
    const allBranchProducts = await ctx.db.query("branchProducts").collect();

    // Group branchProducts by branchId and productId
    const bpByBranch = new Map<string, typeof allBranchProducts>();
    const bpByProduct = new Map<string, typeof allBranchProducts>();

    for (const bp of allBranchProducts) {
      // By branch
      const branchList = bpByBranch.get(bp.branchId) ?? [];
      branchList.push(bp);
      bpByBranch.set(bp.branchId, branchList);

      // By product
      const productList = bpByProduct.get(bp.productId) ?? [];
      productList.push(bp);
      bpByProduct.set(bp.productId, productList);
    }

    // ---- Branch Snapshots ----
    const branchStats: Array<{
      branchId: string;
      branchName: string;
      totalProducts: number;
      totalBeg: number;
      totalSold: number;
      totalSOH: number;
      sellThru: number;
      slowMoverCount: number;
      fastMoverCount: number;
      midMoverCount: number;
    }> = [];

    for (const branch of branches) {
      if (branch.type === "warehouse") continue;

      const bps = bpByBranch.get(branch._id) ?? [];
      let totalBeg = 0;
      let totalSold = 0;
      let totalSOH = 0;
      let slow = 0;
      let fast = 0;
      let mid = 0;

      for (const bp of bps) {
        const beg = bp.beginningStock ?? 0;
        const soh = bp.currentSOH ?? 0;
        const sold = Math.max(0, beg - soh);
        totalBeg += beg;
        totalSold += sold;
        totalSOH += soh;

        const sellThru = beg > 0 ? (sold / beg) * 100 : 0;
        if (sellThru >= 60) fast++;
        else if (sellThru >= 30) mid++;
        else slow++;
      }

      const sellThru = totalBeg > 0 ? (totalSold / totalBeg) * 100 : 0;

      branchStats.push({
        branchId: branch._id,
        branchName: branch.name,
        totalProducts: bps.length,
        totalBeg,
        totalSold,
        totalSOH,
        sellThru: Math.round(sellThru * 100) / 100,
        slowMoverCount: slow,
        fastMoverCount: fast,
        midMoverCount: mid,
      });
    }

    // Rank branches by sell-thru
    branchStats.sort((a, b) => b.sellThru - a.sellThru);

    // Delete old snapshots for today (idempotent)
    const oldBranchSnapshots = await ctx.db
      .query("branchSnapshots")
      .withIndex("by_date", (q) => q.eq("date", today))
      .collect();
    for (const old of oldBranchSnapshots) {
      await ctx.db.delete(old._id);
    }

    // Insert branch snapshots
    for (let i = 0; i < branchStats.length; i++) {
      const s = branchStats[i];
      await ctx.db.insert("branchSnapshots", {
        date: today,
        branchId: s.branchId as any,
        branchName: s.branchName,
        totalProducts: s.totalProducts,
        totalBeg: s.totalBeg,
        totalSold: s.totalSold,
        totalSOH: s.totalSOH,
        sellThru: s.sellThru,
        slowMoverCount: s.slowMoverCount,
        fastMoverCount: s.fastMoverCount,
        midMoverCount: s.midMoverCount,
        rank: i + 1,
        updatedAt: now,
      });
    }

    // ---- Network Snapshot ----
    const networkBeg = branchStats.reduce((sum, b) => sum + b.totalBeg, 0);
    const networkSold = branchStats.reduce((sum, b) => sum + b.totalSold, 0);
    const networkSOH = branchStats.reduce((sum, b) => sum + b.totalSOH, 0);
    const networkSellThru = networkBeg > 0 ? (networkSold / networkBeg) * 100 : 0;
    const networkSlow = branchStats.reduce((sum, b) => sum + b.slowMoverCount, 0);
    const networkFast = branchStats.reduce((sum, b) => sum + b.fastMoverCount, 0);
    const networkMid = branchStats.reduce((sum, b) => sum + b.midMoverCount, 0);

    // Compute retail value
    const productPriceMap = new Map<string, number>();
    for (const p of products) {
      productPriceMap.set(p._id, p.retailPrice ?? 0);
    }
    let totalRetailValue = 0;
    for (const bp of allBranchProducts) {
      totalRetailValue += (bp.currentSOH ?? 0) * (productPriceMap.get(bp.productId) ?? 0);
    }

    // Delete old network snapshot for today
    const oldNetworkSnapshots = await ctx.db
      .query("networkSnapshots")
      .withIndex("by_date", (q) => q.eq("date", today))
      .collect();
    for (const old of oldNetworkSnapshots) {
      await ctx.db.delete(old._id);
    }

    await ctx.db.insert("networkSnapshots", {
      date: today,
      totalProducts: products.filter((p) => p.isActive).length,
      totalBranches: branchStats.length,
      networkSellThru: Math.round(networkSellThru * 100) / 100,
      totalBeg: networkBeg,
      totalSold: networkSold,
      totalSOH: networkSOH,
      slowMoverCount: networkSlow,
      fastMoverCount: networkFast,
      midMoverCount: networkMid,
      totalRetailValue,
      updatedAt: now,
    });

    // ---- Product Snapshots ----
    const oldProductSnapshots = await ctx.db
      .query("productSnapshots")
      .withIndex("by_date", (q) => q.eq("date", today))
      .collect();
    for (const old of oldProductSnapshots) {
      await ctx.db.delete(old._id);
    }

    for (const product of products) {
      if (!product.isActive) continue;

      const bps = bpByProduct.get(product._id) ?? [];
      if (bps.length === 0) continue;

      let totalBeg = 0;
      let totalSold = 0;
      let totalSOH = 0;

      for (const bp of bps) {
        const beg = bp.beginningStock ?? 0;
        const soh = bp.currentSOH ?? 0;
        totalBeg += beg;
        totalSold += Math.max(0, beg - soh);
        totalSOH += soh;
      }

      const sellThru = totalBeg > 0 ? (totalSold / totalBeg) * 100 : 0;
      const classification = sellThru >= 60 ? "Fast" : sellThru >= 30 ? "Mid" : "Slow";

      await ctx.db.insert("productSnapshots", {
        date: today,
        productId: product._id,
        styleCode: product.styleCode,
        productName: product.name,
        category: product.category,
        department: product.department,
        networkBeg: totalBeg,
        networkSold: totalSold,
        networkSOH: totalSOH,
        networkSellThru: Math.round(sellThru * 100) / 100,
        classification,
        branchCount: bps.length,
        updatedAt: now,
      });
    }

    return {
      branchesProcessed: branchStats.length,
      productsProcessed: products.filter((p) => p.isActive).length,
      networkSellThru: Math.round(networkSellThru * 100) / 100,
    };
  },
});
