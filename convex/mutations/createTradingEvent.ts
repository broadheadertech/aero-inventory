import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

/**
 * createTradingEvent — creates a new trading calendar event.
 * Admin only.
 */
export const createTradingEvent = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    eventType: v.union(
      v.literal("collection_launch"),
      v.literal("markdown"),
      v.literal("promotion")
    ),
    startDate: v.string(),
    endDate: v.string(),
    actions: v.array(
      v.object({
        type: v.string(),
        value: v.string(),
        description: v.optional(v.string()),
      })
    ),
    reminderDaysBefore: v.optional(v.number()),
    linkedBranchIds: v.array(v.id("branches")),
    linkedProductFilters: v.optional(
      v.object({
        department: v.optional(v.string()),
        category: v.optional(v.string()),
        collection: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const now = new Date().toISOString();
    const eventId = await ctx.db.insert("tradingEvents", {
      ...args,
      createdByUserId: auth.userId,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      actionType: "create_trading_event",
      actor: auth.userId,
      targetTable: "tradingEvents",
      targetId: eventId,
      details: `Created trading event: ${args.name}`,
      timestamp: now,
    });

    return eventId;
  },
});
