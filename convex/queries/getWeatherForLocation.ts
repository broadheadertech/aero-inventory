import { query } from "../_generated/server";
import { v } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

export const getWeatherForLocation = query({
  args: { locationId: v.id("weatherLocations"), days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const location = await ctx.db.get(args.locationId);
    if (!location) return null;

    const entries = await ctx.db
      .query("weatherCache")
      .withIndex("by_locationId", (q) => q.eq("locationId", args.locationId))
      .collect();

    // Sort by date and limit
    const sorted = entries.sort((a, b) => b.date.localeCompare(a.date));
    const limited = args.days ? sorted.slice(0, args.days) : sorted;

    return { location, weather: limited.reverse() };
  },
});
