import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth } from "../helpers/auth";
import type { Doc } from "../_generated/dataModel";

export const updateSalesEntry = mutation({
  args: {
    salesEntryId: v.id("salesEntries"),
    quantitySold: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);

    const { salesEntryId, quantitySold, notes } = args;

    // Server-side validation: must be a whole positive number
    if (!Number.isInteger(quantitySold) || quantitySold < 1) {
      throw new ConvexError("Quantity sold must be a whole number of at least 1.");
    }

    const existing = (await ctx.db.get(salesEntryId)) as Doc<"salesEntries"> | null;
    if (!existing) throw new ConvexError("Sales entry not found.");

    // Auth: only the entry's author can edit it
    if (existing.enteredBy !== auth.userId) {
      throw new ConvexError("Forbidden: You can only edit your own entries.");
    }

    // Fetch the linked branchProducts record for SOH update
    const branchProduct = (await ctx.db.get(existing.branchProductId)) as Doc<"branchProducts"> | null;
    if (!branchProduct) throw new ConvexError("Branch product record not found.");

    // SOH recalculation: delta = newQty - oldQty; newSOH = currentSOH - delta
    const oldQty = existing.quantitySold;
    const delta = quantitySold - oldQty;
    const newSOH = branchProduct.currentSOH - delta;

    if (newSOH < 0) {
      throw new ConvexError(
        "Cannot reduce quantity: not enough stock to recalculate. Current SOH would go negative."
      );
    }

    const now = new Date().toISOString();

    // Atomic: update both records in the same mutation
    await ctx.db.patch(salesEntryId, {
      quantitySold,
      // Allow clearing notes by passing "" — treat "" as undefined (remove the field)
      notes: notes === "" ? undefined : (notes ?? existing.notes),
    });

    await ctx.db.patch(existing.branchProductId, {
      currentSOH: newSOH,
      updatedAt: now,
    });
  },
});
