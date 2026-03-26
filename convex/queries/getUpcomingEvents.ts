import { query } from "../_generated/server";
import { v } from "convex/values";
import { _requireAuth } from "../helpers/auth";

/**
 * getUpcomingEvents — returns the next N trading events starting from today.
 * Any authenticated role can view upcoming events.
 */
export const getUpcomingEvents = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await _requireAuth(ctx);

    const today = new Date().toISOString().split("T")[0];
    const limit = args.limit ?? 5;

    const allEvents = await ctx.db
      .query("tradingEvents")
      .withIndex("by_startDate")
      .collect();

    return allEvents
      .filter((event) => event.startDate >= today)
      .slice(0, limit);
  },
});
