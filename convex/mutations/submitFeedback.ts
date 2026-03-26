import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { scoreSentiment, extractThemes } from "../helpers/feedbackProcessing";

/**
 * Public feedback submission — no authentication required.
 * Used by QR code forms and web feedback forms.
 * Automatically processes sentiment and themes on submission.
 */
export const submitFeedback = mutation({
  args: {
    productId: v.id("products"),
    branchId: v.optional(v.id("branches")),
    rating: v.number(),
    comment: v.string(),
    contactInfo: v.optional(v.string()),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    const rating = Math.min(5, Math.max(1, Math.round(args.rating)));
    const comment = args.comment.slice(0, 2000);

    // Process sentiment and themes
    const sentiment = scoreSentiment(comment);
    const themeConfigs = await ctx.db.query("feedbackThemeConfig").collect();
    const themes = extractThemes(comment, themeConfigs);

    const now = new Date().toISOString();
    const feedbackId = await ctx.db.insert("customerFeedback", {
      productId: args.productId,
      branchId: args.branchId,
      rating,
      comment,
      contactInfo: args.contactInfo,
      sentiment,
      themes,
      source: args.source,
      createdAt: now,
    });

    return feedbackId;
  },
});
