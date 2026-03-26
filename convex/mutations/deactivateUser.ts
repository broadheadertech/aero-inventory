import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

/**
 * deactivateUser — Admin-only soft deactivation.
 *
 * Sets isActive = false. The _requireAuth helper already throws
 * "Account is deactivated." on subsequent calls by this user,
 * blocking all data access immediately.
 *
 * Historical data (sales entries, audit logs) is preserved.
 */
export const deactivateUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    // Self-deactivation guard
    if (args.userId === auth.userId) {
      throw new ConvexError("You cannot deactivate your own account.");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }
    if (!user.isActive) {
      throw new ConvexError("User is already inactive");
    }

    const now = new Date().toISOString();

    await ctx.db.patch(args.userId, {
      isActive: false,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      actionType: "deactivate_user",
      actor: auth.userId,
      targetTable: "users",
      targetId: args.userId,
      details: `Deactivated user ${user.email}`,
      timestamp: now,
    });
  },
});
