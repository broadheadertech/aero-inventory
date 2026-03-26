import { query } from "../_generated/server";
import { v } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";
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

export const getSellThruNetwork = query({
  args: {
    timePeriod: v.optional(v.string()),
    branchId: v.optional(v.id("branches")),
    department: v.optional(v.string()),
    category: v.optional(v.string()),
    collection: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const timePeriod = args.timePeriod ?? "weekly";
    const thresholds = await _getThresholds(ctx, timePeriod);
    const agingPolicies = await ctx.db.query("agingPolicies").collect();

    // Always load ALL branchProducts so category averages are truly network-wide,
    // regardless of any branchId display filter.
    const allBranchProducts = await ctx.db.query("branchProducts").collect();

    const allRows = await Promise.all(
      allBranchProducts.map(async (bp) => {
        const product = await ctx.db.get(bp.productId);
        const branch = await ctx.db.get(bp.branchId);
        if (!product || !product.isActive) return null;
        if (!branch) return null; // skip orphaned branchProducts (branch deleted)

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
          branchName: branch.name,
          branchType: branch.type ?? "branch",
          productId: bp.productId,
          styleCode: product.styleCode,
          productName: product.name,
          department: product.department,
          category: product.category,
          collection: product.collection,
          imageUrl: product.imageUrl ?? null,
          warehouseArrivalDate: product.warehouseArrivalDate ?? null,
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

    const validRows = allRows.filter((r): r is NonNullable<typeof r> => r !== null);

    // Pass 2: compute category averages across ALL branches (network-wide MI)
    const categoryAvgs = _calculateCategoryAverages(validRows);

    // Pass 3: apply display filters (branchId, department, category, collection)
    // Filtering happens AFTER category averages so MI remains network-scoped.
    const filteredRows = validRows.filter((row) => {
      if (args.branchId && row.branchId !== args.branchId) return false;
      if (args.department && row.department !== args.department) return false;
      if (args.category && row.category !== args.category) return false;
      if (args.collection && row.collection !== args.collection) return false;
      return true;
    });

    // Pass 4: enrich filtered rows with ADS, DSI, MI
    return filteredRows.map((row) => {
      const ads = _calculateADS(row.sold, row.deliveryInStoreDate);
      const dsi = _calculateDSI(row.currentSOH, ads);
      const mi = _calculateMI(row.sellThruPercent, categoryAvgs.get(row.category) ?? null);
      return { ...row, ads, dsi, mi };
    });
  },
});
