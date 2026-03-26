import { query } from "../_generated/server";
import { v } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

/**
 * getRuleHistory — returns all suggestions for a specific replenishment rule.
 * Admin only. Sorted by creation date descending (newest first).
 */
export const getRuleHistory = query({
  args: {
    ruleId: v.id("replenishmentRules"),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const suggestions = await ctx.db
      .query("replenishmentSuggestions")
      .withIndex("by_ruleId", (q) => q.eq("ruleId", args.ruleId))
      .collect();

    // Sort newest first
    suggestions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    // Resolve product and branch names
    const enriched = await Promise.all(
      suggestions.map(async (s) => {
        const product = await ctx.db.get(s.productId);
        const branch = await ctx.db.get(s.branchId);
        return {
          ...s,
          productName: product?.name ?? "Unknown",
          styleCode: product?.styleCode ?? "Unknown",
          branchName: branch?.name ?? "Unknown",
        };
      })
    );

    return enriched;
  },
});
