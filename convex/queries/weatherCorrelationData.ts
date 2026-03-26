import { query } from "../_generated/server";
import { v } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";
import { pearsonCorrelation, isSignificantCorrelation } from "../helpers/weatherCorrelation";

/**
 * Compute weather-sellthru correlation for a product category in a location.
 * Returns correlation coefficient and data pairs for visualization.
 */
export const weatherCorrelationData = query({
  args: {
    locationId: v.id("weatherLocations"),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const location = await ctx.db.get(args.locationId);
    if (!location) return null;

    // Get weather history for this location
    const weatherEntries = await ctx.db
      .query("weatherCache")
      .withIndex("by_locationId", (q) => q.eq("locationId", args.locationId))
      .collect();

    if (weatherEntries.length < 5) {
      return { correlation: 0, significant: false, dataPoints: 0, message: "Insufficient weather data" };
    }

    // Get sales data for branches mapped to this location
    const branchIds = location.branchIds;
    const salesByDate: Record<string, { totalSold: number; totalStock: number }> = {};

    for (const branchId of branchIds) {
      const branchProducts = await ctx.db
        .query("branchProducts")
        .withIndex("by_branchId", (q) => q.eq("branchId", branchId))
        .collect();

      for (const bp of branchProducts) {
        if (args.category) {
          const product = await ctx.db.get(bp.productId);
          if (product?.category !== args.category) continue;
        }

        const sales = await ctx.db
          .query("salesEntries")
          .withIndex("by_productId", (q) => q.eq("productId", bp.productId))
          .filter((q) => q.eq(q.field("branchId"), branchId))
          .collect();

        for (const sale of sales) {
          const date = sale.saleDate.split("T")[0];
          if (!salesByDate[date]) salesByDate[date] = { totalSold: 0, totalStock: 0 };
          salesByDate[date].totalSold += sale.quantitySold;
          salesByDate[date].totalStock += bp.beginningStock ?? 0;
        }
      }
    }

    // Build pairs: match weather date to sales date
    const pairs = weatherEntries
      .filter((w) => salesByDate[w.date])
      .map((w) => ({
        weatherValue: w.temperatureCelsius,
        sellThruPercent: salesByDate[w.date].totalStock > 0
          ? (salesByDate[w.date].totalSold / salesByDate[w.date].totalStock) * 100
          : 0,
        date: w.date,
        temperature: w.temperatureCelsius,
        rainfall: w.rainfallMm,
      }));

    const r = pearsonCorrelation(pairs);

    return {
      correlation: Math.round(r * 1000) / 1000,
      significant: isSignificantCorrelation(r),
      dataPoints: pairs.length,
      pairs: pairs.slice(-30), // Last 30 for visualization
    };
  },
});
