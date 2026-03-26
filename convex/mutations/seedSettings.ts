import { mutation } from "../_generated/server";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

const SEED_DATA = [
  { timePeriod: "daily",     fastThreshold: 1,  slowThreshold: 0.2 },
  { timePeriod: "weekly",    fastThreshold: 5,  slowThreshold: 1   },
  { timePeriod: "monthly",   fastThreshold: 20, slowThreshold: 5   },
  { timePeriod: "quarterly", fastThreshold: 60, slowThreshold: 15  },
];

export const seedSettings = mutation({
  args: {},
  handler: async (ctx) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);
    const now = new Date().toISOString();
    let inserted = 0;
    for (const seed of SEED_DATA) {
      const existing = await ctx.db
        .query("settings")
        .withIndex("by_timePeriod", (q) => q.eq("timePeriod", seed.timePeriod))
        .filter((q) => q.eq(q.field("settingKey"), "sell_thru_thresholds"))
        .first();
      if (!existing) {
        await ctx.db.insert("settings", {
          settingKey: "sell_thru_thresholds",
          timePeriod: seed.timePeriod,
          fastThreshold: seed.fastThreshold,
          slowThreshold: seed.slowThreshold,
          createdBy: auth.userId,
          createdAt: now,
          updatedAt: now,
        });
        inserted++;
      }
    }
    return { inserted };
  },
});
