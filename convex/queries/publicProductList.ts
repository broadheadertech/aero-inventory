import { query } from "../_generated/server";

/**
 * Public product list — no auth required.
 * Returns minimal fields for feedback form product selection.
 */
export const publicProductList = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    return products.map((p) => ({
      _id: p._id,
      name: p.name,
      styleCode: p.styleCode,
      category: p.category,
    }));
  },
});
