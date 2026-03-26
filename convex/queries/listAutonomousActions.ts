import { query } from "../_generated/server";
import { v } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

export const listAutonomousActions = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    if (args.status) {
      return await ctx.db
        .query("autonomousActions")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(100);
    }

    return await ctx.db
      .query("autonomousActions")
      .withIndex("by_executedAt")
      .order("desc")
      .take(100);
  },
});
