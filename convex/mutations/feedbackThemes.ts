import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";
import { DEFAULT_THEMES } from "../helpers/feedbackProcessing";

export const seedDefaultThemes = mutation({
  args: {},
  handler: async (ctx) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const existing = await ctx.db.query("feedbackThemeConfig").collect();
    if (existing.length > 0) return { seeded: false, count: existing.length };

    for (const theme of DEFAULT_THEMES) {
      await ctx.db.insert("feedbackThemeConfig", theme);
    }

    return { seeded: true, count: DEFAULT_THEMES.length };
  },
});

export const upsertTheme = mutation({
  args: {
    theme: v.string(),
    keywords: v.array(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const existing = await ctx.db
      .query("feedbackThemeConfig")
      .withIndex("by_theme", (q) => q.eq("theme", args.theme))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { keywords: args.keywords, isActive: args.isActive });
      return existing._id;
    } else {
      return await ctx.db.insert("feedbackThemeConfig", args);
    }
  },
});

export const deleteTheme = mutation({
  args: { themeId: v.id("feedbackThemeConfig") },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);
    const existing = await ctx.db.get(args.themeId);
    if (!existing) throw new ConvexError("Theme not found.");
    await ctx.db.delete(args.themeId);
  },
});
