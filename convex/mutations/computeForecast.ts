import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";
import { computeWeightedMovingAverage, computeConfidence } from "../helpers/forecast";

export const computeForecast = mutation({
  args: {
    productId: v.id("products"),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const product = await ctx.db.get(args.productId);
    if (!product) throw new ConvexError("Product not found.");

    // Gather historical sell-thru data from salesEntries
    let salesEntries;
    if (args.branchId) {
      salesEntries = await ctx.db
        .query("salesEntries")
        .withIndex("by_productId", (q) => q.eq("productId", args.productId))
        .filter((q) => q.eq(q.field("branchId"), args.branchId))
        .collect();
    } else {
      salesEntries = await ctx.db
        .query("salesEntries")
        .withIndex("by_productId", (q) => q.eq("productId", args.productId))
        .collect();
    }

    // Get branchProducts for stock context
    const branchProducts = await ctx.db
      .query("branchProducts")
      .withIndex("by_productId", (q) => q.eq("productId", args.productId))
      .collect();

    // Aggregate sales by week using enteredAt (actual schema field)
    const weeklyData: Record<string, { totalSold: number }> = {};

    for (const entry of salesEntries) {
      const entryDate = new Date(entry.enteredAt);
      if (isNaN(entryDate.getTime())) continue; // Skip invalid dates
      const weekStart = new Date(entryDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];

      if (!weeklyData[weekKey]) weeklyData[weekKey] = { totalSold: 0 };
      weeklyData[weekKey].totalSold += entry.quantitySold;
    }

    // Compute sell-thru % per week using beginningStock (actual schema field)
    const totalInitialStock = branchProducts.reduce((sum, bp) => sum + bp.beginningStock, 0);

    const dataPoints = Object.entries(weeklyData)
      .map(([weekDate, data]) => ({
        weekDate,
        sellThruPercent: totalInitialStock > 0 ? (data.totalSold / totalInitialStock) * 100 : 0,
      }))
      .sort((a, b) => a.weekDate.localeCompare(b.weekDate));

    const weekForecasts = computeWeightedMovingAverage(dataPoints, 4);
    const confidence = computeConfidence(dataPoints.length);
    const now = new Date().toISOString();

    const forecastId = await ctx.db.insert("demandForecasts", {
      productId: args.productId,
      branchId: args.branchId,
      forecastDate: now.split("T")[0],
      weekForecasts,
      confidence,
      dataPointsUsed: dataPoints.length,
      weatherAdjusted: false,
      createdAt: now,
    });

    return { forecastId, weekForecasts, confidence, dataPointsUsed: dataPoints.length };
  },
});
