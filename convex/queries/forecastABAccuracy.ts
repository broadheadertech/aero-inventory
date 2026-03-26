import { query } from "../_generated/server";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

type ForecastEntry = {
  productId: string;
  weekForecasts: Array<{ weekNumber: number; predictedSellThruPercent: number }>;
};

type BranchProduct = {
  productId: string;
  beginningStock?: number;
  currentSOH: number;
};

// M1 fix: shared accuracy computation helper
function computeAccuraciesPerProduct(
  forecasts: ForecastEntry[],
  products: Array<{ _id: string; name: string }>,
  bpByProduct: Map<string, BranchProduct[]>
): Map<string, { productName: string; accuracies: number[] }> {
  const result = new Map<string, { productName: string; accuracies: number[] }>();

  for (const forecast of forecasts) {
    const product = products.find((p) => p._id === forecast.productId);
    if (!product || !forecast.weekForecasts[0]) continue;

    const bps = bpByProduct.get(forecast.productId) ?? [];
    const totalStock = bps.reduce((sum, bp) => sum + (bp.beginningStock ?? 0), 0);
    const totalSold = bps.reduce((sum, bp) => sum + Math.max(0, (bp.beginningStock ?? 0) - (bp.currentSOH ?? 0)), 0);
    const actualSellThru = totalStock > 0 ? (totalSold / totalStock) * 100 : 0;

    const predicted = forecast.weekForecasts[0].predictedSellThruPercent;
    const variance = Math.abs(predicted - actualSellThru);
    const accuracy = Math.max(0, 100 - variance);

    // M2 fix: collect all accuracies per product, average later
    const existing = result.get(forecast.productId) ?? { productName: product.name, accuracies: [] };
    existing.accuracies.push(accuracy);
    result.set(forecast.productId, existing);
  }

  return result;
}

export const forecastABAccuracy = query({
  args: {},
  handler: async (ctx) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const statForecasts = await ctx.db.query("demandForecasts").withIndex("by_forecastDate").collect();
    const pastStatForecasts = statForecasts.filter((f) => f.forecastDate < oneWeekAgo);

    const mlForecasts = await ctx.db.query("mlForecasts").withIndex("by_forecastDate").collect();
    const pastMLForecasts = mlForecasts.filter((f) => f.forecastDate < oneWeekAgo);

    const products = await ctx.db.query("products").collect();
    const allBranchProducts = await ctx.db.query("branchProducts").collect();
    const bpByProduct = new Map<string, typeof allBranchProducts>();
    for (const bp of allBranchProducts) {
      const list = bpByProduct.get(bp.productId) ?? [];
      list.push(bp);
      bpByProduct.set(bp.productId, list);
    }

    // Compute accuracies using shared helper
    const statAccuracyMap = computeAccuraciesPerProduct(pastStatForecasts as ForecastEntry[], products, bpByProduct);
    const mlAccuracyMap = computeAccuraciesPerProduct(pastMLForecasts as ForecastEntry[], products, bpByProduct);

    // Merge into results with averaged accuracies
    const allProductIds = new Set([...statAccuracyMap.keys(), ...mlAccuracyMap.keys()]);
    const results = Array.from(allProductIds).map((productId) => {
      const stat = statAccuracyMap.get(productId);
      const ml = mlAccuracyMap.get(productId);
      const productName = stat?.productName ?? ml?.productName ?? "Unknown";

      const statAvg = stat ? stat.accuracies.reduce((s, a) => s + a, 0) / stat.accuracies.length : null;
      const mlAvg = ml ? ml.accuracies.reduce((s, a) => s + a, 0) / ml.accuracies.length : null;

      return {
        productId,
        productName,
        statAccuracy: statAvg !== null ? Math.round(statAvg * 10) / 10 : null,
        mlAccuracy: mlAvg !== null ? Math.round(mlAvg * 10) / 10 : null,
        winner: mlAvg !== null && statAvg !== null
          ? mlAvg > statAvg ? "ml" : statAvg > mlAvg ? "statistical" : "tie"
          : null,
      };
    });

    const statAccuracies = results.filter((r) => r.statAccuracy !== null).map((r) => r.statAccuracy!);
    const mlAccuracies = results.filter((r) => r.mlAccuracy !== null).map((r) => r.mlAccuracy!);

    const overallStatAccuracy = statAccuracies.length > 0
      ? statAccuracies.reduce((sum, a) => sum + a, 0) / statAccuracies.length : 0;
    const overallMLAccuracy = mlAccuracies.length > 0
      ? mlAccuracies.reduce((sum, a) => sum + a, 0) / mlAccuracies.length : 0;

    const overallWinner = mlAccuracies.length === 0 ? "statistical"
      : overallMLAccuracy > overallStatAccuracy ? "ml"
      : overallStatAccuracy > overallMLAccuracy ? "statistical" : "tie";

    return {
      results: results.sort((a, b) => (b.mlAccuracy ?? 0) - (a.mlAccuracy ?? 0)),
      overallStatAccuracy: Math.round(overallStatAccuracy * 10) / 10,
      overallMLAccuracy: Math.round(overallMLAccuracy * 10) / 10,
      overallWinner,
      statForecastCount: pastStatForecasts.length,
      mlForecastCount: pastMLForecasts.length,
    };
  },
});
