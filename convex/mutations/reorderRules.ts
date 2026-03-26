import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

export const upsertReorderRule = mutation({
  args: {
    productId: v.id("products"),
    supplierId: v.id("suppliers"),
    safetyBufferDays: v.number(),
    minOrderQuantity: v.number(),
    isEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const now = new Date().toISOString();
    const existing = await ctx.db
      .query("reorderRules")
      .withIndex("by_productId", (q) => q.eq("productId", args.productId))
      .first();

    if (existing) {
      // M1 fix: log supplier change if it differs
      const supplierChanged = existing.supplierId !== args.supplierId;
      await ctx.db.patch(existing._id, { ...args, updatedAt: now });

      await ctx.db.insert("auditLogs", {
        actionType: "update_reorder_rule",
        actor: auth.userId,
        targetTable: "reorderRules",
        targetId: existing._id,
        details: supplierChanged
          ? `Updated reorder rule — supplier changed for product`
          : `Updated reorder rule for product`,
        timestamp: now,
      });

      return existing._id;
    } else {
      const id = await ctx.db.insert("reorderRules", { ...args, updatedAt: now });

      await ctx.db.insert("auditLogs", {
        actionType: "create_reorder_rule",
        actor: auth.userId,
        targetTable: "reorderRules",
        targetId: id,
        details: `Created reorder rule for product`,
        timestamp: now,
      });

      return id;
    }
  },
});

export const deleteReorderRule = mutation({
  args: { ruleId: v.id("reorderRules") },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const rule = await ctx.db.get(args.ruleId);
    if (!rule) throw new ConvexError("Rule not found.");

    // M2 fix: check for active POs linked to this supplier
    const activePOs = await ctx.db
      .query("purchaseOrders")
      .withIndex("by_supplierId", (q) => q.eq("supplierId", rule.supplierId))
      .filter((q) =>
        q.and(
          q.neq(q.field("status"), "closed"),
          q.neq(q.field("status"), "cancelled")
        )
      )
      .first();

    if (activePOs) {
      throw new ConvexError("Cannot delete rule — active purchase orders exist for this supplier. Close or cancel them first.");
    }

    const now = new Date().toISOString();

    // L1 fix: audit log on delete
    await ctx.db.insert("auditLogs", {
      actionType: "delete_reorder_rule",
      actor: auth.userId,
      targetTable: "reorderRules",
      targetId: args.ruleId,
      details: `Deleted reorder rule for product`,
      timestamp: now,
    });

    await ctx.db.delete(args.ruleId);
  },
});
