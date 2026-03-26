import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { _requireAuth } from "../helpers/auth";

export const markNotificationRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== auth.userId) {
      throw new ConvexError("Notification not found.");
    }
    await ctx.db.patch(args.notificationId, { isRead: true });
  },
});
