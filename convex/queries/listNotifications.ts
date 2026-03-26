import { query } from "../_generated/server";
import { _requireAuth } from "../helpers/auth";

export const listNotifications = query({
  args: {},
  handler: async (ctx) => {
    const auth = await _requireAuth(ctx);
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", auth.userId))
      .order("desc")
      .collect();
    return notifications;
  },
});
