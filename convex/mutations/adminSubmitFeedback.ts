import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";
import { scoreSentiment, extractThemes } from "../helpers/feedbackProcessing";

/**
 * Admin manual feedback entry — for feedback received via phone, email, in-person.
 */
export const adminSubmitFeedback = mutation({
  args: {
    productId: v.id("products"),
    branchId: v.optional(v.id("branches")),
    rating: v.number(),
    comment: v.string(),
    contactInfo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const rating = Math.min(5, Math.max(1, Math.round(args.rating)));
    const comment = args.comment.slice(0, 2000);
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
      source: "manual",
      createdAt: now,
    });

    await ctx.db.insert("auditLogs", {
      actionType: "submit_feedback",
      actor: auth.userId,
      targetTable: "customerFeedback",
      targetId: feedbackId,
      details: `Manually entered customer feedback for product`,
      timestamp: now,
    });

    return feedbackId;
  },
});
