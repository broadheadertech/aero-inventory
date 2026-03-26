import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertBranchAccess } from "../helpers/auth";
import { _evaluateReplenishmentRules } from "../helpers/replenishment";
import type { Doc } from "../_generated/dataModel";

export const createSalesEntry = mutation({
  args: {
    branchProductId: v.id("branchProducts"),
    quantitySold: v.number(),
    salePrice: v.optional(v.number()), // centavos; defaults to product.retailPrice
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);

    // Server-side validation
    if (!Number.isInteger(args.quantitySold) || args.quantitySold < 1) {
      throw new ConvexError("quantitySold must be a positive integer.");
    }

    if (
      args.salePrice !== undefined &&
      (!Number.isInteger(args.salePrice) || args.salePrice < 0)
    ) {
      throw new ConvexError("salePrice must be a non-negative integer (centavos).");
    }

    // Fetch the branchProduct record
    const branchProduct = (await ctx.db.get(
      args.branchProductId
    )) as Doc<"branchProducts"> | null;
    if (!branchProduct) {
      throw new ConvexError("Product assignment not found.");
    }

    // Enforce branch access — Staff can only sell from their own branch
    _assertBranchAccess(auth, branchProduct.branchId);

    // Fetch product for default salePrice
    const product = (await ctx.db.get(
      branchProduct.productId
    )) as Doc<"products"> | null;
    if (!product) {
      throw new ConvexError("Product not found.");
    }

    // Validate quantity against current SOH
    if (args.quantitySold > branchProduct.currentSOH) {
      throw new ConvexError(
        `Cannot sell ${args.quantitySold} units — only ${branchProduct.currentSOH} in stock.`
      );
    }

    const now = new Date().toISOString();
    const salePrice = args.salePrice ?? product.retailPrice; // centavos

    // Atomic: insert salesEntry AND decrement SOH
    await ctx.db.insert("salesEntries", {
      branchId: branchProduct.branchId,
      productId: branchProduct.productId,
      branchProductId: args.branchProductId,
      quantitySold: args.quantitySold,
      salePrice,
      enteredBy: auth.userId, // Convex users._id — NOT Clerk userId
      enteredAt: now,
      notes: args.notes,
    });

    const newSOH = branchProduct.currentSOH - args.quantitySold;

    await ctx.db.patch(args.branchProductId, {
      currentSOH: newSOH,
      updatedAt: now,
    });

    // Evaluate replenishment rules after SOH update (non-blocking on failure)
    try {
      await _evaluateReplenishmentRules(
        ctx,
        branchProduct.branchId,
        branchProduct.productId,
        newSOH
      );
    } catch {
      // Evaluation failure is non-blocking — sales entry already saved successfully
    }

    // Incremental snapshot update (non-blocking)
    try {
      const today = now.split("T")[0];

      // Update network snapshot
      const networkSnap = await ctx.db
        .query("networkSnapshots")
        .withIndex("by_date", (q) => q.eq("date", today))
        .first();
      if (networkSnap) {
        const newTotalSold = networkSnap.totalSold + args.quantitySold;
        const newTotalSOH = networkSnap.totalSOH - args.quantitySold;
        const newSellThru = networkSnap.totalBeg > 0 ? (newTotalSold / networkSnap.totalBeg) * 100 : 0;
        const newRetailValue = networkSnap.totalRetailValue - (args.quantitySold * salePrice);
        await ctx.db.patch(networkSnap._id, {
          totalSold: newTotalSold,
          totalSOH: newTotalSOH,
          networkSellThru: Math.round(newSellThru * 100) / 100,
          totalRetailValue: newRetailValue,
          updatedAt: now,
        });
      }

      // Update branch snapshot
      const branchSnap = await ctx.db
        .query("branchSnapshots")
        .withIndex("by_date_branchId", (q) => q.eq("date", today).eq("branchId", branchProduct.branchId))
        .first();
      if (branchSnap) {
        const newSold = branchSnap.totalSold + args.quantitySold;
        const newSOHSnap = branchSnap.totalSOH - args.quantitySold;
        const newSellThru = branchSnap.totalBeg > 0 ? (newSold / branchSnap.totalBeg) * 100 : 0;
        await ctx.db.patch(branchSnap._id, {
          totalSold: newSold,
          totalSOH: newSOHSnap,
          sellThru: Math.round(newSellThru * 100) / 100,
          updatedAt: now,
        });
      }
    } catch {
      // Snapshot update failure is non-blocking
    }
  },
});
