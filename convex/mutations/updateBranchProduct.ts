import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

export const updateBranchProduct = mutation({
  args: {
    branchProductId: v.id("branchProducts"),
    beginningStock: v.optional(v.number()),
    // Accept "" to explicitly clear the field (same pattern as updateProduct)
    deliveryInStoreDate: v.optional(v.union(v.string(), v.literal(""))),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const { branchProductId, beginningStock, deliveryInStoreDate } = args;

    if (
      beginningStock !== undefined &&
      (!Number.isInteger(beginningStock) || beginningStock < 0)
    ) {
      throw new ConvexError(
        "Beginning stock must be a non-negative whole number."
      );
    }

    const existing = await ctx.db.get(branchProductId);
    if (!existing) throw new ConvexError("Branch product record not found.");

    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { updatedAt: now };

    if (beginningStock !== undefined) {
      // Recalculate SOH to preserve units sold
      const totalSold = existing.beginningStock - existing.currentSOH;
      const newSOH = Math.max(0, beginningStock - totalSold);
      patch.beginningStock = beginningStock;
      patch.currentSOH = newSOH;
    }

    if (deliveryInStoreDate !== undefined) {
      // "" clears the field, any other string sets it
      patch.deliveryInStoreDate =
        deliveryInStoreDate === "" ? undefined : deliveryInStoreDate;
    }

    await ctx.db.patch(branchProductId, patch);
  },
});
