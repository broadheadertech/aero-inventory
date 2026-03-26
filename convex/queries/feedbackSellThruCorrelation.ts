import { query } from "../_generated/server";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

/**
 * Products with feedback themes correlated with sell-thru classification.
 * Shows products with negative feedback alongside their sell-thru status.
 */
export const feedbackSellThruCorrelation = query({
  args: {},
  handler: async (ctx) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const allFeedback = await ctx.db.query("customerFeedback").collect();

    // Group feedback by product
    const feedbackByProduct = new Map<string, typeof allFeedback>();
    for (const f of allFeedback) {
      const list = feedbackByProduct.get(f.productId) ?? [];
      list.push(f);
      feedbackByProduct.set(f.productId, list);
    }

    const results = await Promise.all(
      Array.from(feedbackByProduct.entries()).map(async ([productId, feedback]) => {
        const product = await ctx.db.get(productId as any);
        if (!product) return null;

        // Get sell-thru classification from branchProducts
        const branchProducts = await ctx.db
          .query("branchProducts")
          .withIndex("by_productId", (q) => q.eq("productId", productId as any))
          .collect();

        const classification = branchProducts[0]?.classification ?? "Unknown";
        const totalBeginning = branchProducts.reduce((sum, bp) => sum + (bp.beginningStock ?? 0), 0);
        const totalSold = branchProducts.reduce((sum, bp) => sum + Math.max(0, (bp.beginningStock ?? 0) - (bp.currentSOH ?? 0)), 0);
        const sellThruPercent = totalBeginning > 0 ? (totalSold / totalBeginning) * 100 : 0;

        const negativeCount = feedback.filter((f) => f.sentiment === "negative").length;
        const positiveCount = feedback.filter((f) => f.sentiment === "positive").length;
        const avgRating = feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length;

        // Collect all themes
        const themes: string[] = [];
        for (const f of feedback) themes.push(...f.themes);
        const uniqueThemes = [...new Set(themes)];

        return {
          productId,
          productName: product.name,
          styleCode: product.styleCode,
          classification,
          sellThruPercent: Math.round(sellThruPercent * 100) / 100,
          feedbackCount: feedback.length,
          avgRating: Math.round(avgRating * 10) / 10,
          negativeCount,
          positiveCount,
          themes: uniqueThemes,
          hasNegativeFeedback: negativeCount > positiveCount,
        };
      })
    );

    return results
      .filter(Boolean)
      .sort((a, b) => (b!.negativeCount - b!.positiveCount) - (a!.negativeCount - a!.positiveCount));
  },
});
