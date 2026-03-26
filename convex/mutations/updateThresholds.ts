import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

export const updateThresholds = mutation({
  args: {
    timePeriod: v.string(),
    fastThreshold: v.number(),
    slowThreshold: v.number(),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const VALID_PERIODS = ["daily", "weekly", "monthly", "quarterly"];
    if (!VALID_PERIODS.includes(args.timePeriod)) {
      throw new ConvexError(`Invalid time period: ${args.timePeriod}`);
    }
    if (args.fastThreshold <= args.slowThreshold) {
      throw new ConvexError("Fast threshold must be greater than Slow threshold");
    }
    if (args.fastThreshold < 0 || args.slowThreshold < 0) {
      throw new ConvexError("Thresholds must be non-negative");
    }

    const now = new Date().toISOString();
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_timePeriod", (q) => q.eq("timePeriod", args.timePeriod))
      .filter((q) => q.eq(q.field("settingKey"), "sell_thru_thresholds"))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        fastThreshold: args.fastThreshold,
        slowThreshold: args.slowThreshold,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("settings", {
        settingKey: "sell_thru_thresholds",
        timePeriod: args.timePeriod,
        fastThreshold: args.fastThreshold,
        slowThreshold: args.slowThreshold,
        createdBy: auth.userId,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});
