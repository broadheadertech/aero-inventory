import { query } from "../_generated/server";
import { v } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

export const productFeedbackSummary = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const product = await ctx.db.get(args.productId);
    if (!product) return null;

    const feedback = await ctx.db
      .query("customerFeedback")
      .withIndex("by_productId", (q) => q.eq("productId", args.productId))
      .collect();

    if (feedback.length === 0) {
      return {
        product: { name: product.name, styleCode: product.styleCode },
        totalCount: 0,
        avgRating: 0,
        sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
        themeBreakdown: [],
        entries: [],
      };
    }

    const avgRating = feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length;

    const sentimentBreakdown = {
      positive: feedback.filter((f) => f.sentiment === "positive").length,
      neutral: feedback.filter((f) => f.sentiment === "neutral").length,
      negative: feedback.filter((f) => f.sentiment === "negative").length,
    };

    // Count themes
    const themeCounts: Record<string, number> = {};
    for (const f of feedback) {
      for (const theme of f.themes) {
        themeCounts[theme] = (themeCounts[theme] ?? 0) + 1;
      }
    }
    const themeBreakdown = Object.entries(themeCounts)
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count);

    // Recent entries (last 20)
    const entries = feedback
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 20)
      .map((f) => ({
        _id: f._id,
        rating: f.rating,
        comment: f.comment,
        sentiment: f.sentiment,
        themes: f.themes,
        source: f.source,
        createdAt: f.createdAt,
      }));

    return {
      product: { name: product.name, styleCode: product.styleCode },
      totalCount: feedback.length,
      avgRating: Math.round(avgRating * 10) / 10,
      sentimentBreakdown,
      themeBreakdown,
      entries,
    };
  },
});
