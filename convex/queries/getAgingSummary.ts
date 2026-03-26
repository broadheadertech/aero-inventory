import { query } from "../_generated/server";
import { v } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";
import {
  _calculateSellThru,
  _classify,
  _getThresholds,
  _applyAgingRemark,
} from "../helpers/sellThru";

export const getAgingSummary = query({
  args: {
    timePeriod: v.optional(v.string()),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const timePeriod = args.timePeriod ?? "weekly";
    const thresholds = await _getThresholds(ctx, timePeriod);
    const agingPolicies = await ctx.db.query("agingPolicies").collect();

    // Build priority map: remark text → lowest priority number across all policies
    const remarkPriorityMap = new Map<string, number>();
    for (const p of agingPolicies) {
      const existing = remarkPriorityMap.get(p.recommendedAction);
      if (existing === undefined || p.priority < existing) {
        remarkPriorityMap.set(p.recommendedAction, p.priority);
      }
    }

    // Load branchProducts — use index when filtering by branch
    const branchProducts = args.branchId
      ? await ctx.db
          .query("branchProducts")
          .withIndex("by_branchId", (q) => q.eq("branchId", args.branchId!))
          .collect()
      : await ctx.db.query("branchProducts").collect();

    const allRows = await Promise.all(
      branchProducts.map(async (bp) => {
        const product = await ctx.db.get(bp.productId);
        const branch = await ctx.db.get(bp.branchId);
        if (!product || !product.isActive) return null;
        if (!branch) return null;

        const sellThru = _calculateSellThru(bp.beginningStock, bp.currentSOH);
        const classification = sellThru
          ? _classify(sellThru.sellThruPercent, thresholds.fastThreshold, thresholds.slowThreshold)
          : "N/A";
        const sellThruPercent = sellThru?.sellThruPercent ?? null;

        const weeksOnFloor = bp.deliveryInStoreDate
          ? Math.floor((Date.now() - new Date(bp.deliveryInStoreDate).getTime()) / (1000 * 60 * 60 * 24 * 7))
          : null;

        const remark = _applyAgingRemark(agingPolicies, classification, weeksOnFloor);

        return {
          branchProductId: bp._id,
          branchId: bp.branchId,
          branchName: branch.name,
          styleCode: product.styleCode,
          productName: product.name,
          imageUrl: product.imageUrl ?? null,
          weeksOnFloor,
          sellThruPercent,
          currentSOH: bp.currentSOH,
          remark,
        };
      })
    );

    const validRows = allRows.filter((r): r is NonNullable<typeof r> => r !== null);

    // Group by remark into bracket buckets
    const buckets = new Map<string, {
      products: typeof validRows;
      totalSOH: number;
      sellThruSum: number;
      sellThruCount: number;
    }>();

    for (const row of validRows) {
      const key = row.remark;
      if (!buckets.has(key)) {
        buckets.set(key, { products: [], totalSOH: 0, sellThruSum: 0, sellThruCount: 0 });
      }
      const bucket = buckets.get(key)!;
      bucket.products.push(row);
      bucket.totalSOH += row.currentSOH;
      if (row.sellThruPercent !== null) {
        bucket.sellThruSum += row.sellThruPercent;
        bucket.sellThruCount++;
      }
    }

    // Build and sort output — use Number.MAX_SAFE_INTEGER for "—" (Infinity not serializable)
    const result = Array.from(buckets.entries()).map(([remark, bucket]) => ({
      remark,
      priority: remarkPriorityMap.get(remark) ?? Number.MAX_SAFE_INTEGER,
      productCount: bucket.products.length,
      totalSOH: bucket.totalSOH,
      avgSellThruPercent:
        bucket.sellThruCount > 0
          ? Math.round((bucket.sellThruSum / bucket.sellThruCount) * 10) / 10
          : null,
      products: bucket.products.map((r) => ({
        branchProductId: r.branchProductId,
        styleCode: r.styleCode,
        productName: r.productName,
        imageUrl: r.imageUrl,
        branchId: r.branchId,
        branchName: r.branchName,
        weeksOnFloor: r.weeksOnFloor,
        sellThruPercent: r.sellThruPercent,
        currentSOH: r.currentSOH,
      })),
    }));

    result.sort((a, b) => a.priority - b.priority);
    return result;
  },
});
