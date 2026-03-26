import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

/**
 * allocateWarehouseStock — transfers stock from the Central Warehouse to a branch.
 * Admin only. Decrements warehouse SOH and upserts destination branch branchProducts.
 * Validate-then-write pattern (same as approveTransfer).
 */
export const allocateWarehouseStock = mutation({
  args: {
    productId: v.id("products"),
    destinationBranchId: v.id("branches"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    if (args.quantity <= 0) {
      throw new ConvexError("Quantity must be greater than zero.");
    }

    if (!Number.isInteger(args.quantity)) {
      throw new ConvexError("Quantity must be a whole number.");
    }

    // --- VALIDATION PHASE ---

    // Fetch warehouse
    const warehouse = await ctx.db
      .query("branches")
      .withIndex("by_type", (q) => q.eq("type", "warehouse"))
      .first();

    if (!warehouse) {
      throw new ConvexError("No warehouse found.");
    }

    // Fetch warehouse branchProducts record for this product
    const warehouseBP = await ctx.db
      .query("branchProducts")
      .withIndex("by_branchId", (q) => q.eq("branchId", warehouse._id))
      .filter((q) => q.eq(q.field("productId"), args.productId))
      .unique();

    if (!warehouseBP) {
      throw new ConvexError("Product not found in warehouse stock.");
    }

    if (args.quantity > warehouseBP.currentSOH) {
      throw new ConvexError(
        `Warehouse stock insufficient (${warehouseBP.currentSOH} available).`
      );
    }

    // Fetch destination branch
    const destBranch = await ctx.db.get(args.destinationBranchId);
    if (!destBranch) {
      throw new ConvexError("Destination branch not found.");
    }
    if (destBranch._id === warehouse._id) {
      throw new ConvexError("Cannot allocate stock to the warehouse itself.");
    }
    if (!destBranch.isActive) {
      throw new ConvexError("Destination branch is not active.");
    }

    // Fetch destination branchProducts record (may not exist)
    const destBP =
      (await ctx.db
        .query("branchProducts")
        .withIndex("by_branchId", (q) =>
          q.eq("branchId", args.destinationBranchId)
        )
        .filter((q) => q.eq(q.field("productId"), args.productId))
        .unique()) ?? null;

    // --- WRITE PHASE ---
    const now = new Date().toISOString();

    // Decrement warehouse SOH
    await ctx.db.patch(warehouseBP._id, {
      currentSOH: warehouseBP.currentSOH - args.quantity,
      updatedAt: now,
    });

    // Upsert destination branchProducts
    if (destBP) {
      await ctx.db.patch(destBP._id, {
        currentSOH: destBP.currentSOH + args.quantity,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("branchProducts", {
        branchId: args.destinationBranchId,
        productId: args.productId,
        beginningStock: args.quantity,
        currentSOH: args.quantity,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Audit log
    await ctx.db.insert("auditLogs", {
      actionType: "warehouse_allocation",
      actor: auth.userId,
      targetTable: "branchProducts",
      targetId: warehouseBP._id as string,
      details: `Warehouse allocated ${args.quantity} unit(s) of product ${args.productId} to branch ${args.destinationBranchId} (${destBranch.name}).`,
      timestamp: now,
    });

    return destBranch.name;
  },
});
