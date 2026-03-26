import { query } from "../_generated/server";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

/**
 * getWarehouseStock — returns all branchProducts for the warehouse branch,
 * joined with product details.
 * Admin only.
 */
export const getWarehouseStock = query({
  args: {},
  handler: async (ctx) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const warehouse = await ctx.db
      .query("branches")
      .withIndex("by_type", (q) => q.eq("type", "warehouse"))
      .first();

    if (!warehouse) return null;

    const branchProducts = await ctx.db
      .query("branchProducts")
      .withIndex("by_branchId", (q) => q.eq("branchId", warehouse._id))
      .collect();

    const items = await Promise.all(
      branchProducts.map(async (bp) => {
        const product = await ctx.db.get(bp.productId);
        return { ...bp, product };
      })
    );

    return {
      warehouse,
      items: items.filter((i) => i.product !== null),
    };
  },
});
