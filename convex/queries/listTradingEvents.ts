import { query } from "../_generated/server";
import { v } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

/**
 * listTradingEvents — returns all trading calendar events.
 * Admin only. Supports optional filtering by event type.
 * Results sorted by startDate ascending.
 */
export const listTradingEvents = query({
  args: {
    eventType: v.optional(
      v.union(
        v.literal("collection_launch"),
        v.literal("markdown"),
        v.literal("promotion")
      )
    ),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    if (args.eventType) {
      return await ctx.db
        .query("tradingEvents")
        .withIndex("by_eventType", (q) => q.eq("eventType", args.eventType!))
        .collect();
    }

    return await ctx.db
      .query("tradingEvents")
      .withIndex("by_startDate")
      .collect();
  },
});
