import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertBranchAccess } from "../helpers/auth";

/**
 * confirmReplenishmentSuggestion — one-tap confirm creates a transfer request.
 * Branch Manager or Admin. Creates transfer from warehouse to branch.
 */
export const confirmReplenishmentSuggestion = mutation({
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

    // Branch access check
    _assertBranchAccess(auth, suggestion.branchId);

    // Find warehouse branch
    const warehouse = await ctx.db
      .query("branches")
      .withIndex("by_type", (q) => q.eq("type", "warehouse"))
      .first();

    if (!warehouse) {
      throw new ConvexError("No warehouse found. Cannot create transfer request.");
    }

    // Check warehouse stock availability
    const warehouseBP = await ctx.db
      .query("branchProducts")
      .withIndex("by_branchId_productId", (q) =>
        q.eq("branchId", warehouse._id).eq("productId", suggestion.productId)
      )
      .unique();

    if (!warehouseBP || warehouseBP.currentSOH < suggestion.suggestedQuantity) {
      throw new ConvexError(
        `Insufficient warehouse stock. Available: ${warehouseBP?.currentSOH ?? 0}, Requested: ${suggestion.suggestedQuantity}`
      );
    }

    const now = new Date().toISOString();

    // Create transfer request (source: warehouse, destination: suggestion's branch)
    const transferId = await ctx.db.insert("transfers", {
      sourceBranchId: warehouse._id,
      destinationBranchId: suggestion.branchId,
      requestedByUserId: auth.userId,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    // Create transfer item
    await ctx.db.insert("transferItems", {
      transferId,
      productId: suggestion.productId,
      quantity: suggestion.suggestedQuantity,
    });

    // Mark suggestion as confirmed with transfer reference
    await ctx.db.patch(args.suggestionId, {
      status: "confirmed",
      confirmedTransferId: transferId,
    });
  },
});
