import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

/**
 * confirmAllocation — confirms allocation and creates batch transfer requests.
 * Admin only. Atomic: all transfers created or none (NFR15).
 */
export const confirmAllocation = mutation({
  args: {
    productId: v.id("products"),
    totalQuantity: v.number(),
    allocations: v.array(
      v.object({
        branchId: v.id("branches"),
        adjustedQty: v.number(),
        recommendedQty: v.number(),
        sellThruRate: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    // Validate total matches
    const totalAllocated = args.allocations.reduce((sum, a) => sum + a.adjustedQty, 0);
    if (totalAllocated !== args.totalQuantity) {
      throw new ConvexError(
        `Allocated quantity (${totalAllocated}) does not match total (${args.totalQuantity}).`
      );
    }

    // Find warehouse
    const warehouse = await ctx.db
      .query("branches")
      .withIndex("by_type", (q) => q.eq("type", "warehouse"))
      .first();
    if (!warehouse) throw new ConvexError("No warehouse found.");

    // Check warehouse has enough stock
    const warehouseBP = await ctx.db
      .query("branchProducts")
      .withIndex("by_branchId", (q) => q.eq("branchId", warehouse._id))
      .filter((q) => q.eq(q.field("productId"), args.productId))
      .unique();

    if (!warehouseBP) {
      throw new ConvexError("Product not found in warehouse stock.");
    }

    if (args.totalQuantity > warehouseBP.currentSOH) {
      throw new ConvexError(
        `Warehouse stock insufficient. Requested: ${args.totalQuantity}, Available: ${warehouseBP.currentSOH}. Reduce allocation or record inbound stock first.`
      );
    }

    const now = new Date().toISOString();

    // Create batch transfers atomically
    for (const alloc of args.allocations) {
      if (alloc.adjustedQty <= 0) continue;

      const transferId = await ctx.db.insert("transfers", {
        sourceBranchId: warehouse._id,
        destinationBranchId: alloc.branchId,
        requestedByUserId: auth.userId,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      });

      await ctx.db.insert("transferItems", {
        transferId,
        productId: args.productId,
        quantity: alloc.adjustedQty,
      });
    }

    // Save allocation history
    await ctx.db.insert("allocationHistory", {
      productId: args.productId,
      totalQuantity: args.totalQuantity,
      allocations: args.allocations.map((a) => ({
        branchId: a.branchId,
        recommendedQty: a.recommendedQty,
        adjustedQty: a.adjustedQty,
        sellThruRate: a.sellThruRate,
      })),
      algorithmVersion: "v1_weighted_avg",
      createdByUserId: auth.userId,
      createdAt: now,
    });

    await ctx.db.insert("auditLogs", {
      actionType: "confirm_allocation",
      actor: auth.userId,
      targetTable: "allocationHistory",
      details: `Allocated ${args.totalQuantity} units across ${args.allocations.filter((a) => a.adjustedQty > 0).length} branches`,
      timestamp: now,
    });
  },
});
