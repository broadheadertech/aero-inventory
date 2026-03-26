import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";
import { computeWeightedMovingAverage, computeConfidence } from "../helpers/forecast";

/**
 * Generate ML forecast for a product.
 * Simulated: takes statistical forecast base, applies model-quality-scaled variance.
 * In production, this would call an external ML inference API.
 */
export const generateMLForecast = mutation({
  args: {
    productId: v.id("products"),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    // Get latest ready ML model
    const latestModel = await ctx.db
      .query("mlModels")
      .withIndex("by_status", (q) => q.eq("status", "ready"))
      .order("desc")
      .first();

    if (!latestModel) throw new ConvexError("No trained ML model available. Train a model first.");

    // Get historical sell-thru data for statistical baseline
    const salesEntries = await ctx.db
      .query("salesEntries")
      .withIndex("by_productId", (q) => q.eq("productId", args.productId))
      .collect();

    const branchProducts = await ctx.db
      .query("branchProducts")
      .withIndex("by_productId", (q) => q.eq("productId", args.productId))
      .collect();

    // Aggregate weekly data for statistical baseline
    const weeklyData: Record<string, number> = {};
    for (const entry of salesEntries) {
      const weekStart = new Date(entry.enteredAt);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];
      weeklyData[weekKey] = (weeklyData[weekKey] ?? 0) + entry.quantitySold;
    }

    const totalStock = branchProducts.reduce((sum, bp) => sum + (bp.beginningStock ?? 0), 0);
    const dataPoints = Object.entries(weeklyData)
      .map(([weekDate, sold]) => ({
        weekDate,
        sellThruPercent: totalStock > 0 ? (sold / totalStock) * 100 : 0,
      }))
      .sort((a, b) => a.weekDate.localeCompare(b.weekDate));

    const statisticalForecasts = computeWeightedMovingAverage(dataPoints, 4);

    // Simulate ML improvement: apply model accuracy to reduce error
    const modelAccuracy = latestModel.accuracy ?? 70;
    const improvementFactor = modelAccuracy / 100;

    // M1 fix: deterministic variance using product data hash instead of Math.random()
    const mlWeekForecasts = statisticalForecasts.map((sf) => {
      // Deterministic adjustment based on week number and base value
      const hashSeed = (sf.weekNumber * 7 + Math.round(sf.predictedSellThruPercent * 13)) % 10;
      const trendAdjustment = ((hashSeed - 4) / 10) * (1 - improvementFactor) * 5;
      const predicted = Math.max(0, Math.min(100, sf.predictedSellThruPercent + trendAdjustment));
      return {
        weekNumber: sf.weekNumber,
        predictedSellThruPercent: Math.round(predicted * 100) / 100,
      };
    });

    // M2 fix: compute confidence level once
    const confidenceLevel = computeConfidence(dataPoints.length);
    const confidenceMultiplier = confidenceLevel === "high" ? 0.9 : confidenceLevel === "medium" ? 0.7 : 0.5;
    const confidence = Math.min(0.95, improvementFactor * confidenceMultiplier);
    const now = new Date().toISOString();

    const forecastId = await ctx.db.insert("mlForecasts", {
      productId: args.productId,
      branchId: args.branchId,
      modelVersion: latestModel.modelVersion,
      forecastDate: now.split("T")[0],
      weekForecasts: mlWeekForecasts,
      confidence: Math.round(confidence * 100) / 100,
      createdAt: now,
    });

    return { forecastId, modelVersion: latestModel.modelVersion, confidence, weekForecasts: mlWeekForecasts };
  },
});
