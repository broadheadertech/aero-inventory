import { query } from "../_generated/server";
import { v } from "convex/values";
import { _requireAuth } from "../helpers/auth";
import {
  _calculateSellThru,
  _classify,
  _getThresholds,
  _calculateADS,
  _calculateDSI,
  _calculateMI,
  _calculateCategoryAverages,
  _applyAgingRemark,
} from "../helpers/sellThru";

export const getSellThruByBranch = query({
  args: {
    timePeriod: v.optional(v.string()),
    department: v.optional(v.string()),
    category: v.optional(v.string()),
    collection: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    if (auth.role === "Admin") return []; // Admins use getSellThruNetwork
    if (auth.branchIds.length === 0) return [];
    const branchId = auth.branchIds[0];

    const timePeriod = args.timePeriod ?? "weekly";
    const thresholds = await _getThresholds(ctx, timePeriod);
    const agingPolicies = await ctx.db.query("agingPolicies").collect();

    const branchProducts = await ctx.db
      .query("branchProducts")
      .withIndex("by_branchId", (q) => q.eq("branchId", branchId))
      .collect();

    const rows = await Promise.all(
      branchProducts.map(async (bp) => {
        const product = await ctx.db.get(bp.productId);
        if (!product || !product.isActive) return null;
        if (args.department && product.department !== args.department) return null;
        if (args.category && product.category !== args.category) return null;
        if (args.collection && product.collection !== args.collection) return null;

        const sellThru = _calculateSellThru(bp.beginningStock, bp.currentSOH);
        const classification = sellThru
          ? _classify(sellThru.sellThruPercent, thresholds.fastThreshold, thresholds.slowThreshold)
          : "N/A";
        const sellThruPercent = sellThru?.sellThruPercent ?? null;
        const sold = sellThru?.sold ?? 0;

        const weeksOnFloor = bp.deliveryInStoreDate
          ? Math.floor((Date.now() - new Date(bp.deliveryInStoreDate).getTime()) / (1000 * 60 * 60 * 24 * 7))
          : null;

        return {
          branchProductId: bp._id,
          branchId: bp.branchId,
          productId: bp.productId,
          styleCode: product.styleCode,
          productName: product.name,
          imageUrl: product.imageUrl ?? null,
          department: product.department,
          category: product.category,
          collection: product.collection,
          beginningStock: bp.beginningStock,
          sold,
          currentSOH: bp.currentSOH,
          sellThruPercent,
          classification,
          weeksOnFloor,
          deliveryInStoreDate: bp.deliveryInStoreDate ?? null,
          retailPrice: product.retailPrice,
          unitCost: product.unitCost,
          remark: _applyAgingRemark(agingPolicies, classification, weeksOnFloor),
        };
      })
    );

    const filteredRows = rows.filter((r): r is NonNullable<typeof r> => r !== null);

    // Pass 2: compute category averages for MI
    const categoryAvgs = _calculateCategoryAverages(filteredRows);

    // Pass 3: enrich rows with ADS, DSI, MI
    return filteredRows.map((row) => {
      const ads = _calculateADS(row.sold, row.deliveryInStoreDate);
      const dsi = _calculateDSI(row.currentSOH, ads);
      const mi = _calculateMI(row.sellThruPercent, categoryAvgs.get(row.category) ?? null);
      return { ...row, ads, dsi, mi };
    });
  },
});
