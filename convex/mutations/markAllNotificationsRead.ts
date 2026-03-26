import { mutation } from "../_generated/server";
import { _requireAuth } from "../helpers/auth";

export const markAllNotificationsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const auth = await _requireAuth(ctx);
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_isRead", (q) => q.eq("userId", auth.userId))
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();
    await Promise.all(unread.map((n) => ctx.db.patch(n._id, { isRead: true })));
  },
});
