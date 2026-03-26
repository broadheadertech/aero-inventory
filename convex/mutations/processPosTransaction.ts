import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const processPosTransaction = internalMutation({
  args: {
    transactionId: v.string(),
    branchId: v.id("branches"),
    sku: v.string(),
    quantity: v.number(),
    priceCentavos: v.number(),
    posTimestamp: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    // Deduplication check
    const existing = await ctx.db
      .query("posTransactions")
      .withIndex("by_transactionId", (q) => q.eq("transactionId", args.transactionId))
      .first();

    if (existing) {
      // Duplicate — ignore idempotently
      if (existing.syncStatus !== "duplicate") {
        await ctx.db.patch(existing._id, { syncStatus: "duplicate" });
      }
      return;
    }

    // Map SKU to product using by_styleCode index (M1 fix: no full table scan)
    const product = await ctx.db
      .query("products")
      .withIndex("by_styleCode", (q) => q.eq("styleCode", args.sku))
      .first();

    if (!product) {
      await ctx.db.insert("posTransactions", {
        transactionId: args.transactionId,
        branchId: args.branchId,
        sku: args.sku,
        quantity: args.quantity,
        priceCentavos: args.priceCentavos,
        posTimestamp: args.posTimestamp,
        syncStatus: "failed",
        errorMessage: `Product not found for SKU: ${args.sku}`,
        createdAt: now,
      });

      const config = await ctx.db
        .query("posConfig")
        .withIndex("by_branchId", (q) => q.eq("branchId", args.branchId))
        .first();
      if (config) {
        await ctx.db.patch(config._id, { syncErrorCount: config.syncErrorCount + 1 });
      }
      return;
    }

    // Find branchProduct
    const branchProduct = await ctx.db
      .query("branchProducts")
      .withIndex("by_productId", (q) => q.eq("productId", product._id))
      .filter((q) => q.eq(q.field("branchId"), args.branchId))
      .first();

    if (!branchProduct) {
      await ctx.db.insert("posTransactions", {
        transactionId: args.transactionId,
        branchId: args.branchId,
        productId: product._id,
        sku: args.sku,
        quantity: args.quantity,
        priceCentavos: args.priceCentavos,
        posTimestamp: args.posTimestamp,
        syncStatus: "failed",
        errorMessage: `Product not assigned to this branch`,
        createdAt: now,
      });
      return;
    }

    // Update SOH atomically
    await ctx.db.patch(branchProduct._id, {
      currentSOH: Math.max(0, branchProduct.currentSOH - args.quantity),
      totalSold: branchProduct.totalSold + args.quantity,
    });

    // Create sales entry (M2 fix: match actual salesEntries schema)
    // Use a system user lookup for POS entries
    const systemUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();

    if (systemUser) {
      await ctx.db.insert("salesEntries", {
        productId: product._id,
        branchId: args.branchId,
        branchProductId: branchProduct._id,
        quantitySold: args.quantity,
        salePrice: args.priceCentavos,
        enteredBy: systemUser._id,
        enteredAt: args.posTimestamp,
        notes: `POS auto-sync (txn: ${args.transactionId})`,
      });
    }

    // Log successful transaction
    await ctx.db.insert("posTransactions", {
      transactionId: args.transactionId,
      branchId: args.branchId,
      productId: product._id,
      sku: args.sku,
      quantity: args.quantity,
      priceCentavos: args.priceCentavos,
      posTimestamp: args.posTimestamp,
      syncStatus: "synced",
      createdAt: now,
    });

    // Update POS config stats
    const config = await ctx.db
      .query("posConfig")
      .withIndex("by_branchId", (q) => q.eq("branchId", args.branchId))
      .first();
    if (config) {
      await ctx.db.patch(config._id, {
        lastSyncAt: now,
        syncSuccessCount: config.syncSuccessCount + 1,
      });
    }
  },
});
