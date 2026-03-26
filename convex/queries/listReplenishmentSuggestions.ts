import { query } from "../_generated/server";
import { v } from "convex/values";
import { _requireAuth } from "../helpers/auth";
import { ConvexError } from "convex/values";

/**
 * listReplenishmentSuggestions — returns pending restock suggestions.
 * Branch Manager: own branch only. Admin: all or filtered by branchId.
 */
export const listReplenishmentSuggestions = query({
  args: {
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);

    let suggestions;

    if (auth.role === "Admin") {
      if (args.branchId) {
        suggestions = await ctx.db
          .query("replenishmentSuggestions")
          .withIndex("by_branchId_status", (q) =>
            q.eq("branchId", args.branchId!).eq("status", "pending")
          )
          .collect();
      } else {
        suggestions = await ctx.db
          .query("replenishmentSuggestions")
          .withIndex("by_status", (q) => q.eq("status", "pending"))
          .collect();
      }
    } else if (auth.role === "Branch Manager") {
      // Branch Manager: filter by their branches
      const allPending = [];
      for (const branchId of auth.branchIds) {
        const branchSuggestions = await ctx.db
          .query("replenishmentSuggestions")
          .withIndex("by_branchId_status", (q) =>
            q.eq("branchId", branchId).eq("status", "pending")
          )
          .collect();
        allPending.push(...branchSuggestions);
      }
      suggestions = allPending;
    } else {
      throw new ConvexError("Forbidden: Branch Staff cannot view replenishment suggestions");
    }

    // Enrich with product and branch names
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

    // Sort newest first
    enriched.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return enriched;
  },
});
