import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

export const recordDelivery = mutation({
  args: {
    supplierId: v.id("suppliers"),
    promisedDate: v.string(),
    actualDate: v.string(),
    quantityOrdered: v.number(),
    quantityReceived: v.number(),
    qualityNotes: v.optional(v.string()),
    qualityRejected: v.number(),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const supplier = await ctx.db.get(args.supplierId);
    if (!supplier) throw new ConvexError("Supplier not found.");

    const promised = new Date(args.promisedDate);
    const actual = new Date(args.actualDate);
    const varianceDays = Math.round((actual.getTime() - promised.getTime()) / (1000 * 60 * 60 * 24));

    let status: string;
    if (varianceDays <= 0) status = "on-time";
    else if (varianceDays <= 2) status = "slightly-late";
    else status = "late";

    const now = new Date().toISOString();
    const deliveryId = await ctx.db.insert("supplierDeliveries", {
      supplierId: args.supplierId,
      promisedDate: args.promisedDate,
      actualDate: args.actualDate,
      quantityOrdered: args.quantityOrdered,
      quantityReceived: args.quantityReceived,
      qualityNotes: args.qualityNotes,
      qualityRejected: args.qualityRejected,
      status,
      leadTimeVarianceDays: varianceDays,
      createdAt: now,
    });

    await ctx.db.insert("auditLogs", {
      actionType: "record_delivery",
      actor: auth.userId,
      targetTable: "supplierDeliveries",
      targetId: deliveryId,
      details: `Recorded delivery for ${supplier.name}: ${status}, variance ${varianceDays}d`,
      timestamp: now,
    });

    return deliveryId;
  },
});
