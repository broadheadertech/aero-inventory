import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

const VALID_ACTION_TYPES = ["markdown", "replenishment", "allocation"] as const;

export const upsertGuardrail = mutation({
  args: {
    actionType: v.string(),
    isEnabled: v.boolean(),
    maxMarkdownPercent: v.optional(v.number()),
    maxAllocationQty: v.optional(v.number()),
    maxReplenishmentQty: v.optional(v.number()),
    forecastVarianceTolerance: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    if (!VALID_ACTION_TYPES.includes(args.actionType as typeof VALID_ACTION_TYPES[number])) {
      throw new ConvexError(`Invalid action type: ${args.actionType}. Must be one of: ${VALID_ACTION_TYPES.join(", ")}`);
    }

    const now = new Date().toISOString();
    const existing = await ctx.db
      .query("autonomousGuardrails")
      .withIndex("by_actionType", (q) => q.eq("actionType", args.actionType))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: now });

      await ctx.db.insert("auditLogs", {
        actionType: "update_guardrail",
        actor: auth.userId,
        targetTable: "autonomousGuardrails",
        targetId: existing._id,
        details: `Updated guardrail for ${args.actionType}: enabled=${args.isEnabled}`,
        timestamp: now,
      });

      return existing._id;
    } else {
      const id = await ctx.db.insert("autonomousGuardrails", { ...args, updatedAt: now });

      await ctx.db.insert("auditLogs", {
        actionType: "create_guardrail",
        actor: auth.userId,
        targetTable: "autonomousGuardrails",
        targetId: id,
        details: `Created guardrail for ${args.actionType}`,
        timestamp: now,
      });

      return id;
    }
  },
});

export const toggleAutonomousMode = mutation({
  args: {
    actionType: v.optional(v.string()),
    isEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const now = new Date().toISOString();

    if (args.actionType) {
      // Toggle specific action type
      const guardrail = await ctx.db
        .query("autonomousGuardrails")
        .withIndex("by_actionType", (q) => q.eq("actionType", args.actionType!))
        .first();

      if (guardrail) {
        await ctx.db.patch(guardrail._id, { isEnabled: args.isEnabled, updatedAt: now });
      }
    } else {
      // Toggle all action types (global)
      const all = await ctx.db.query("autonomousGuardrails").collect();
      for (const g of all) {
        await ctx.db.patch(g._id, { isEnabled: args.isEnabled, updatedAt: now });
      }
    }

    // Use first guardrail ID as target, or actor ID for global toggle
    const firstGuardrail = await ctx.db.query("autonomousGuardrails").first();
    await ctx.db.insert("auditLogs", {
      actionType: "toggle_autonomous",
      actor: auth.userId,
      targetTable: "autonomousGuardrails",
      targetId: firstGuardrail?._id ?? auth.userId,
      details: `${args.isEnabled ? "Enabled" : "Disabled"} autonomous mode${args.actionType ? ` for ${args.actionType}` : " globally"}`,
      timestamp: now,
    });
  },
});
