import { query } from "../_generated/server";
import { v } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

export const forecastABComparison = query({
  args: {
    productId: v.id("products"),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const product = await ctx.db.get(args.productId);
    if (!product) return null;

    // Get latest statistical forecast
    const statForecasts = await ctx.db
      .query("demandForecasts")
      .withIndex("by_productId", (q) => q.eq("productId", args.productId))
      .collect();

    const statFiltered = args.branchId
      ? statForecasts.filter((f) => f.branchId === args.branchId)
      : statForecasts.filter((f) => !f.branchId);

    const latestStat = statFiltered.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;

    // Get latest ML forecast
    const mlForecasts = await ctx.db
      .query("mlForecasts")
      .withIndex("by_productId", (q) => q.eq("productId", args.productId))
      .collect();

    const mlFiltered = args.branchId
      ? mlForecasts.filter((f) => f.branchId === args.branchId)
      : mlForecasts.filter((f) => !f.branchId);

    const latestML = mlFiltered.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;

    // Get latest ready model info
    const latestModel = await ctx.db
      .query("mlModels")
      .withIndex("by_status", (q) => q.eq("status", "ready"))
      .order("desc")
      .first();

    return {
      product: { name: product.name, styleCode: product.styleCode },
      statistical: latestStat ? {
        weekForecasts: latestStat.weekForecasts,
        confidence: latestStat.confidence,
        dataPointsUsed: latestStat.dataPointsUsed,
        createdAt: latestStat.createdAt,
      } : null,
      ml: latestML ? {
        weekForecasts: latestML.weekForecasts,
        confidence: latestML.confidence,
        modelVersion: latestML.modelVersion,
        createdAt: latestML.createdAt,
      } : null,
      mlModelAvailable: !!latestModel,
      mlModelVersion: latestModel?.modelVersion ?? null,
      mlModelAccuracy: latestModel?.accuracy ?? null,
    };
  },
});
