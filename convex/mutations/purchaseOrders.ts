import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["sent", "cancelled"],
  sent: ["acknowledged", "cancelled"],
  acknowledged: ["shipped", "cancelled"],
  shipped: ["received"],
  received: ["closed"],
};

export const updatePOStatus = mutation({
  args: {
    poId: v.id("purchaseOrders"),
    newStatus: v.string(),
    expectedDeliveryDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const po = await ctx.db.get(args.poId);
    if (!po) throw new ConvexError("Purchase order not found.");

    const allowed = VALID_TRANSITIONS[po.status];
    if (!allowed || !allowed.includes(args.newStatus)) {
      throw new ConvexError(`Cannot transition from "${po.status}" to "${args.newStatus}".`);
    }

    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { status: args.newStatus };

    if (args.newStatus === "sent") updates.sentAt = now;
    if (args.newStatus === "acknowledged") {
      updates.acknowledgedAt = now;
      if (args.expectedDeliveryDate) updates.expectedDeliveryDate = args.expectedDeliveryDate;
    }
    if (args.newStatus === "received") updates.receivedAt = now;

    await ctx.db.patch(args.poId, updates);

    await ctx.db.insert("auditLogs", {
      actionType: "update_po_status",
      actor: auth.userId,
      targetTable: "purchaseOrders",
      targetId: args.poId,
      details: `PO status: ${po.status} → ${args.newStatus}`,
      timestamp: now,
    });
  },
});

export const createManualPO = mutation({
  args: {
    supplierId: v.id("suppliers"),
    items: v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(),
      unitCostCentavos: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const totalCost = args.items.reduce((sum, item) => sum + item.quantity * item.unitCostCentavos, 0);
    const now = new Date().toISOString();

    const poId = await ctx.db.insert("purchaseOrders", {
      supplierId: args.supplierId,
      status: "draft",
      items: args.items,
      totalCostCentavos: totalCost,
      triggeredBy: "manual",
      reorderReason: "Manually created by Admin",
      createdAt: now,
    });

    await ctx.db.insert("auditLogs", {
      actionType: "create_po",
      actor: auth.userId,
      targetTable: "purchaseOrders",
      targetId: poId,
      details: `Manual PO created with ${args.items.length} items, total ₱${(totalCost / 100).toFixed(2)}`,
      timestamp: now,
    });

    return poId;
  },
});

export const cancelPO = mutation({
  args: { poId: v.id("purchaseOrders") },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const po = await ctx.db.get(args.poId);
    if (!po) throw new ConvexError("PO not found.");
    // L1 fix: align with VALID_TRANSITIONS — shipped/received/closed cannot be cancelled
    const nonCancellable = ["shipped", "received", "closed"];
    if (nonCancellable.includes(po.status)) {
      throw new ConvexError(`Cannot cancel a ${po.status} PO.`);
    }

    await ctx.db.patch(args.poId, { status: "cancelled" });

    await ctx.db.insert("auditLogs", {
      actionType: "cancel_po",
      actor: auth.userId,
      targetTable: "purchaseOrders",
      targetId: args.poId,
      details: `PO cancelled (was: ${po.status})`,
      timestamp: new Date().toISOString(),
    });
  },
});
