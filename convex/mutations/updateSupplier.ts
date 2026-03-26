import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

export const updateSupplier = mutation({
  args: {
    supplierId: v.id("suppliers"),
    name: v.string(),
    contactName: v.string(),
    contactEmail: v.string(),
    phone: v.optional(v.string()),
    leadTimeDays: v.number(),
    productsSupplied: v.array(v.id("products")),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const existing = await ctx.db.get(args.supplierId);
    if (!existing) throw new ConvexError("Supplier not found.");

    const { supplierId, ...updateFields } = args;
    const now = new Date().toISOString();

    await ctx.db.patch(supplierId, { ...updateFields, updatedAt: now });

    await ctx.db.insert("auditLogs", {
      actionType: "update_supplier",
      actor: auth.userId,
      targetTable: "suppliers",
      targetId: supplierId,
      details: `Updated supplier: ${args.name}`,
      timestamp: now,
    });
  },
});
