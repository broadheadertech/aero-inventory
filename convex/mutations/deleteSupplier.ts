import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

export const deleteSupplier = mutation({
  args: { supplierId: v.id("suppliers") },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const existing = await ctx.db.get(args.supplierId);
    if (!existing) throw new ConvexError("Supplier not found.");

    const now = new Date().toISOString();

    await ctx.db.insert("auditLogs", {
      actionType: "delete_supplier",
      actor: auth.userId,
      targetTable: "suppliers",
      targetId: args.supplierId,
      details: `Deleted supplier: ${existing.name}`,
      timestamp: now,
    });

    await ctx.db.delete(args.supplierId);
  },
});
