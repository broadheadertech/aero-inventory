import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

export const createMarkdownRule = mutation({
  args: {
    name: v.string(),
    classification: v.string(),
    minWeeksOnFloor: v.number(),
    markdownPercent: v.number(),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);
    const now = new Date().toISOString();
    const ruleId = await ctx.db.insert("markdownRules", {
      ...args,
      isEnabled: true,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("auditLogs", {
      actionType: "create_markdown_rule",
      actor: auth.userId,
      targetTable: "markdownRules",
      targetId: ruleId,
      details: `Created markdown rule: ${args.name}`,
      timestamp: now,
    });
    return ruleId;
  },
});

export const updateMarkdownRule = mutation({
  args: {
    ruleId: v.id("markdownRules"),
    name: v.string(),
    classification: v.string(),
    minWeeksOnFloor: v.number(),
    markdownPercent: v.number(),
    isEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);
    const existing = await ctx.db.get(args.ruleId);
    if (!existing) throw new ConvexError("Rule not found.");
    const { ruleId, ...fields } = args;
    await ctx.db.patch(ruleId, { ...fields, updatedAt: new Date().toISOString() });
  },
});

export const deleteMarkdownRule = mutation({
  args: { ruleId: v.id("markdownRules") },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);
    const existing = await ctx.db.get(args.ruleId);
    if (!existing) throw new ConvexError("Rule not found.");
    await ctx.db.delete(args.ruleId);
  },
});
