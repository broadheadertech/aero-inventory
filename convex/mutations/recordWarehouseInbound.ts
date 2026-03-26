import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

/**
 * recordWarehouseInbound — records an inbound stock delivery to the warehouse.
 * Upserts branchProducts: creates a new record if none exists, or increases
 * currentSOH and beginningStock for an existing record.
 * Admin only.
 */
export const recordWarehouseInbound = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    if (args.quantity <= 0) {
      throw new ConvexError("Quantity must be greater than zero.");
    }

    const warehouse = await ctx.db
      .query("branches")
      .withIndex("by_type", (q) => q.eq("type", "warehouse"))
      .first();

    if (!warehouse) {
      throw new ConvexError("No warehouse found. Please create a warehouse location first.");
    }

    const product = await ctx.db.get(args.productId);
    if (!product || !product.isActive) {
      throw new ConvexError("Product not found or inactive.");
    }

    const now = new Date().toISOString();

    const existing = await ctx.db
      .query("branchProducts")
      .withIndex("by_branchId", (q) => q.eq("branchId", warehouse._id))
      .filter((q) => q.eq(q.field("productId"), args.productId))
      .unique();

    let branchProductId;
    if (existing) {
      await ctx.db.patch(existing._id, {
        beginningStock: existing.beginningStock + args.quantity,
        currentSOH: existing.currentSOH + args.quantity,
        updatedAt: now,
      });
      branchProductId = existing._id;
    } else {
      branchProductId = await ctx.db.insert("branchProducts", {
        branchId: warehouse._id,
        productId: args.productId,
        beginningStock: args.quantity,
        currentSOH: args.quantity,
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.insert("auditLogs", {
      actionType: "warehouse_inbound",
      actor: auth.userId,
      targetTable: "branchProducts",
      targetId: branchProductId as string,
      details: `Warehouse inbound: ${args.quantity} unit(s) of product ${args.productId} to ${warehouse.name}`,
      timestamp: now,
    });

    return branchProductId;
  },
});
