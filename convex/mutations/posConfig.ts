import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

export const createPosConfig = mutation({
  args: {
    branchId: v.id("branches"),
    webhookSecret: v.string(),
    isEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    // Check for existing config
    const existing = await ctx.db
      .query("posConfig")
      .withIndex("by_branchId", (q) => q.eq("branchId", args.branchId))
      .first();

    if (existing) throw new ConvexError("POS config already exists for this branch. Use update instead.");

    const now = new Date().toISOString();
    const configId = await ctx.db.insert("posConfig", {
      branchId: args.branchId,
      webhookSecret: args.webhookSecret,
      isEnabled: args.isEnabled,
      syncSuccessCount: 0,
      syncErrorCount: 0,
    });

    await ctx.db.insert("auditLogs", {
      actionType: "create_pos_config",
      actor: auth.userId,
      targetTable: "posConfig",
      targetId: configId,
      details: `Created POS config for branch`,
      timestamp: now,
    });

    return configId;
  },
});

export const updatePosConfig = mutation({
  args: {
    configId: v.id("posConfig"),
    webhookSecret: v.optional(v.string()),
    isEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const existing = await ctx.db.get(args.configId);
    if (!existing) throw new ConvexError("POS config not found.");

    const updates: Record<string, unknown> = { isEnabled: args.isEnabled };
    if (args.webhookSecret) updates.webhookSecret = args.webhookSecret;

    await ctx.db.patch(args.configId, updates);
  },
});
