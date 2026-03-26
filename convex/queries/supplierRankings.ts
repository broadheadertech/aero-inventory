import { query } from "../_generated/server";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

export const supplierRankings = query({
  args: {},
  handler: async (ctx) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const suppliers = await ctx.db.query("suppliers").withIndex("by_isActive").collect();

    const rankings = await Promise.all(
      suppliers.map(async (supplier) => {
        const deliveries = await ctx.db
          .query("supplierDeliveries")
          .withIndex("by_supplierId", (q) => q.eq("supplierId", supplier._id))
          .collect();

        if (deliveries.length === 0) {
          return { supplier, compositeScore: 0, totalDeliveries: 0, onTimeRate: 0 };
        }

        const onTimeCount = deliveries.filter((d) => d.status === "on-time").length;
        const onTimeRate = onTimeCount / deliveries.length;

        const totalVariance = deliveries.reduce((sum, d) => sum + Math.abs(d.leadTimeVarianceDays), 0);
        const leadTimeScore = Math.max(0, 1 - totalVariance / deliveries.length / 10);

        const totalReceived = deliveries.reduce((sum, d) => sum + d.quantityReceived, 0);
        const totalRejected = deliveries.reduce((sum, d) => sum + d.qualityRejected, 0);
        const qualityScore = totalReceived > 0 ? 1 - totalRejected / totalReceived : 1;

        const compositeScore = onTimeRate * 0.4 + leadTimeScore * 0.3 + qualityScore * 0.3;

        return { supplier, compositeScore, totalDeliveries: deliveries.length, onTimeRate };
      })
    );

    return rankings.sort((a, b) => b.compositeScore - a.compositeScore);
  },
});
