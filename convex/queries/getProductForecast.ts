import { query } from "../_generated/server";
import { v } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

export const getProductForecast = query({
  args: {
    productId: v.id("products"),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const product = await ctx.db.get(args.productId);
    if (!product) return null;

    // Get latest forecast
    const forecasts = await ctx.db
      .query("demandForecasts")
      .withIndex("by_productId", (q) => q.eq("productId", args.productId))
      .collect();

    const filtered = args.branchId
      ? forecasts.filter((f) => f.branchId === args.branchId)
      : forecasts.filter((f) => !f.branchId);

    const latest = filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;

    return { product, forecast: latest };
  },
});
