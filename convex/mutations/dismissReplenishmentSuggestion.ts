import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertBranchAccess } from "../helpers/auth";

/**
 * dismissReplenishmentSuggestion — marks a suggestion as dismissed.
 * Branch Manager or Admin.
 */
export const dismissReplenishmentSuggestion = mutation({
  args: {
    suggestionId: v.id("replenishmentSuggestions"),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);

    const suggestion = await ctx.db.get(args.suggestionId);
    if (!suggestion) throw new ConvexError("Suggestion not found.");
    if (suggestion.status !== "pending") {
      throw new ConvexError("Suggestion is no longer pending.");
    }

    _assertBranchAccess(auth, suggestion.branchId);

    await ctx.db.patch(args.suggestionId, { status: "dismissed" });
  },
});
