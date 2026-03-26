import { query } from "../_generated/server";
import { _requireAuth } from "../helpers/auth";

const PERIOD_ORDER = ["daily", "weekly", "monthly", "quarterly"];

export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    await _requireAuth(ctx); // All roles can read settings
    const rows = await ctx.db
      .query("settings")
      .withIndex("by_settingKey", (q) => q.eq("settingKey", "sell_thru_thresholds"))
      .collect();
    return rows.sort(
      (a, b) => PERIOD_ORDER.indexOf(a.timePeriod) - PERIOD_ORDER.indexOf(b.timePeriod)
    );
  },
});
