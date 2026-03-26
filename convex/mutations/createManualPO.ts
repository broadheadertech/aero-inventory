import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

/**
 * createManualPO — Admin manually creates a purchase order for a supplier.
 */
export const createManualPO = mutation({
  args: {
    supplierId: v.id("suppliers"),
    items: v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    if (args.items.length === 0) {
      throw new ConvexError("At least one item is required.");
    }

    // Validate and compute costs
    const itemsWithCost = [];
    let totalCost = 0;

    for (const item of args.items) {
      if (item.quantity <= 0) throw new ConvexError("Quantity must be positive.");

      const product = await ctx.db.get(item.productId);
      if (!product) throw new ConvexError("Product not found.");

      const unitCost = product.unitCost ?? 0;
      totalCost += unitCost * item.quantity;

      itemsWithCost.push({
        productId: item.productId,
        quantity: item.quantity,
        unitCostCentavos: unitCost,
      });
    }

    const now = new Date().toISOString();

    const poId = await ctx.db.insert("purchaseOrders", {
      supplierId: args.supplierId,
      status: "draft",
      items: itemsWithCost,
      totalCostCentavos: totalCost,
      triggeredBy: "manual",
      reorderReason: "Manual purchase order created by Admin",
      createdAt: now,
    });

    await ctx.db.insert("auditLogs", {
      actionType: "create_po",
      actor: auth.userId,
      targetTable: "purchaseOrders",
      targetId: poId as string,
      details: `Manual PO created: ${args.items.length} item(s), total ${(totalCost / 100).toFixed(2)}`,
      timestamp: now,
    });

    return poId;
  },
});
