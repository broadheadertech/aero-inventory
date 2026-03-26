import { query } from "../_generated/server";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

export const forecastAccuracy = query({
  args: {},
  handler: async (ctx) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    // Get all forecasts older than 1 week (so actuals can be compared)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const forecasts = await ctx.db
      .query("demandForecasts")
      .withIndex("by_forecastDate")
      .collect();

    const pastForecasts = forecasts.filter((f) => f.forecastDate < oneWeekAgo);

    const results = await Promise.all(
      pastForecasts.map(async (forecast) => {
        const product = await ctx.db.get(forecast.productId);

        // Get actual sales data for the forecast period
        const forecastDate = new Date(forecast.forecastDate);
        const salesEntries = await ctx.db
          .query("salesEntries")
          .withIndex("by_productId", (q) => q.eq("productId", forecast.productId))
          .collect();

        const branchProducts = await ctx.db
          .query("branchProducts")
          .withIndex("by_productId", (q) => q.eq("productId", forecast.productId))
          .collect();

        const totalStock = branchProducts.reduce((sum, bp) => sum + (bp.beginningStock ?? 0), 0);

        // Compare week 1 forecast with actual
        const week1End = new Date(forecastDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        const actualSalesInWeek1 = salesEntries.filter((s) => {
          const d = new Date(s.saleDate);
          return d >= forecastDate && d < week1End;
        }).reduce((sum, s) => sum + s.quantitySold, 0);

        const actualSellThru = totalStock > 0 ? (actualSalesInWeek1 / totalStock) * 100 : 0;
        const predicted = forecast.weekForecasts[0]?.predictedSellThruPercent ?? 0;
        const variance = Math.abs(predicted - actualSellThru);
        const accuracy = Math.max(0, 100 - variance);

        return {
          forecastId: forecast._id,
          forecastDate: forecast.forecastDate,
          productName: product?.name ?? "Unknown",
          productSku: product?.sku ?? "",
          predicted: Math.round(predicted * 100) / 100,
          actual: Math.round(actualSellThru * 100) / 100,
          variance: Math.round(variance * 100) / 100,
          accuracy: Math.round(accuracy * 100) / 100,
          confidence: forecast.confidence,
        };
      })
    );

    const overallAccuracy = results.length > 0
      ? results.reduce((sum, r) => sum + r.accuracy, 0) / results.length
      : 0;

    return { results: results.sort((a, b) => b.forecastDate.localeCompare(a.forecastDate)), overallAccuracy };
  },
});
