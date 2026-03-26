import { query } from "../_generated/server";
import { v } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

export const supplierScorecard = query({
  args: { supplierId: v.id("suppliers") },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const supplier = await ctx.db.get(args.supplierId);
    if (!supplier) return null;

    const deliveries = await ctx.db
      .query("supplierDeliveries")
      .withIndex("by_supplierId", (q) => q.eq("supplierId", args.supplierId))
      .collect();

    if (deliveries.length === 0) {
      return {
        supplier,
        deliveries: [],
        metrics: {
          totalDeliveries: 0,
          onTimeRate: 0,
          avgLeadTimeVariance: 0,
          qualityRejectionRate: 0,
          compositeScore: 0,
        },
      };
    }

    const onTimeCount = deliveries.filter((d) => d.status === "on-time").length;
    const onTimeRate = onTimeCount / deliveries.length;

    const totalVariance = deliveries.reduce((sum, d) => sum + Math.abs(d.leadTimeVarianceDays), 0);
    const avgLeadTimeVariance = totalVariance / deliveries.length;
    const leadTimeScore = Math.max(0, 1 - avgLeadTimeVariance / 10);

    const totalReceived = deliveries.reduce((sum, d) => sum + d.quantityReceived, 0);
    const totalRejected = deliveries.reduce((sum, d) => sum + d.qualityRejected, 0);
    const qualityRejectionRate = totalReceived > 0 ? totalRejected / totalReceived : 0;
    const qualityScore = 1 - qualityRejectionRate;

    // Composite: on-time 40%, lead time 30%, quality 30%
    const compositeScore = onTimeRate * 0.4 + leadTimeScore * 0.3 + qualityScore * 0.3;

    return {
      supplier,
      deliveries,
      metrics: {
        totalDeliveries: deliveries.length,
        onTimeRate,
        avgLeadTimeVariance,
        qualityRejectionRate,
        compositeScore,
      },
    };
  },
});
