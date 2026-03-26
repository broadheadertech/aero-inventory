import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth } from "../helpers/auth";
import type { Doc } from "../_generated/dataModel";

export const deleteSalesEntry = mutation({
  args: {
    salesEntryId: v.id("salesEntries"),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);

    const existing = (await ctx.db.get(args.salesEntryId)) as Doc<"salesEntries"> | null;
    if (!existing) throw new ConvexError("Sales entry not found.");

    // Auth: only the entry's author can delete it
    if (existing.enteredBy !== auth.userId) {
      throw new ConvexError("Forbidden: You can only delete your own entries.");
    }

    // Fetch the linked branchProducts record for SOH restoration
    const branchProduct = (await ctx.db.get(existing.branchProductId)) as Doc<"branchProducts"> | null;
    if (!branchProduct) throw new ConvexError("Branch product record not found.");

    const now = new Date().toISOString();

    // Atomic: restore SOH first, then delete the entry — both in same transaction
    // newSOH = currentSOH + oldQty (full reversal, can never go negative)
    await ctx.db.patch(existing.branchProductId, {
      currentSOH: branchProduct.currentSOH + existing.quantitySold,
      updatedAt: now,
    });

    await ctx.db.delete(args.salesEntryId);
  },
});
