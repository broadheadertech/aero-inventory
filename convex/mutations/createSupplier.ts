import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

export const createSupplier = mutation({
  args: {
    name: v.string(),
    contactName: v.string(),
    contactEmail: v.string(),
    phone: v.optional(v.string()),
    leadTimeDays: v.number(),
    productsSupplied: v.array(v.id("products")),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const now = new Date().toISOString();
    const supplierId = await ctx.db.insert("suppliers", {
      ...args,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      actionType: "create_supplier",
      actor: auth.userId,
      targetTable: "suppliers",
      targetId: supplierId,
      details: `Created supplier: ${args.name}`,
      timestamp: now,
    });

    return supplierId;
  },
});
