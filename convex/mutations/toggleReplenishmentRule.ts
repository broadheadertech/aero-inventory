import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

export const toggleReplenishmentRule = mutation({
  args: { ruleId: v.id("replenishmentRules") },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const existing = await ctx.db.get(args.ruleId);
    if (!existing) throw new ConvexError("Replenishment rule not found.");

    const now = new Date().toISOString();
    const newEnabled = !existing.isEnabled;

    await ctx.db.patch(args.ruleId, { isEnabled: newEnabled, updatedAt: now });

    await ctx.db.insert("auditLogs", {
      actionType: "toggle_replenishment_rule",
      actor: auth.userId,
      targetTable: "replenishmentRules",
      targetId: args.ruleId,
      details: `${newEnabled ? "Enabled" : "Disabled"} replenishment rule: ${existing.name}`,
      timestamp: now,
    });
  },
});
