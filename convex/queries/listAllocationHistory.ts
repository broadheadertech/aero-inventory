import { query } from "../_generated/server";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

/**
 * listAllocationHistory — returns all past allocations sorted newest first.
 * Admin only.
 */
export const listAllocationHistory = query({
  args: {},
  handler: async (ctx) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const history = await ctx.db
      .query("allocationHistory")
      .withIndex("by_createdAt")
      .collect();

    // Sort newest first
    history.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    // Enrich with product info
    const enriched = await Promise.all(
      history.map(async (h) => {
        const product = await ctx.db.get(h.productId);
        return {
          ...h,
          productName: product?.name ?? "Unknown",
          styleCode: product?.styleCode ?? "Unknown",
          branchCount: h.allocations.filter((a) => a.adjustedQty > 0).length,
        };
      })
    );

    return enriched;
  },
});
