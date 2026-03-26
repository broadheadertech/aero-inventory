import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

export const updateReplenishmentRule = mutation({
  args: {
    ruleId: v.id("replenishmentRules"),
    name: v.string(),
    scope: v.union(v.literal("all"), v.literal("category"), v.literal("specific")),
    scopeFilter: v.optional(
      v.object({
        department: v.optional(v.string()),
        category: v.optional(v.string()),
        productIds: v.optional(v.array(v.id("products"))),
      })
    ),
    thresholdDays: v.number(),
    coverageDays: v.number(),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const existing = await ctx.db.get(args.ruleId);
    if (!existing) throw new ConvexError("Replenishment rule not found.");

    const { ruleId, ...updateFields } = args;
    const now = new Date().toISOString();

    await ctx.db.patch(ruleId, { ...updateFields, updatedAt: now });

    await ctx.db.insert("auditLogs", {
      actionType: "update_replenishment_rule",
      actor: auth.userId,
      targetTable: "replenishmentRules",
      targetId: ruleId,
      details: `Updated replenishment rule: ${args.name}`,
      timestamp: now,
    });
  },
});
