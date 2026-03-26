import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

/**
 * deleteTradingEvent — deletes a trading calendar event.
 * Admin only.
 */
export const deleteTradingEvent = mutation({
  args: {
    eventId: v.id("tradingEvents"),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const existing = await ctx.db.get(args.eventId);
    if (!existing) {
      throw new ConvexError("Trading event not found.");
    }

    const now = new Date().toISOString();

    await ctx.db.insert("auditLogs", {
      actionType: "delete_trading_event",
      actor: auth.userId,
      targetTable: "tradingEvents",
      targetId: args.eventId,
      details: `Deleted trading event: ${existing.name}`,
      timestamp: now,
    });

    await ctx.db.delete(args.eventId);
  },
});
