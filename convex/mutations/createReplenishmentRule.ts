import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

export const createReplenishmentRule = mutation({
  args: {
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

    const now = new Date().toISOString();
    const ruleId = await ctx.db.insert("replenishmentRules", {
      ...args,
      isEnabled: true,
      createdByUserId: auth.userId,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      actionType: "create_replenishment_rule",
      actor: auth.userId,
      targetTable: "replenishmentRules",
      targetId: ruleId,
      details: `Created replenishment rule: ${args.name}`,
      timestamp: now,
    });

    return ruleId;
  },
});
