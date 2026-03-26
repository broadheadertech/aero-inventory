import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

/**
 * updateTradingEvent — updates an existing trading calendar event.
 * Admin only.
 */
export const updateTradingEvent = mutation({
  args: {
    eventId: v.id("tradingEvents"),
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

    const existing = await ctx.db.get(args.eventId);
    if (!existing) {
      throw new ConvexError("Trading event not found.");
    }

    const { eventId, ...updateFields } = args;
    const now = new Date().toISOString();

    await ctx.db.patch(eventId, {
      ...updateFields,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      actionType: "update_trading_event",
      actor: auth.userId,
      targetTable: "tradingEvents",
      targetId: eventId,
      details: `Updated trading event: ${args.name}`,
      timestamp: now,
    });
  },
});
