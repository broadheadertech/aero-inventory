import { query } from "../_generated/server";
import { v } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";
import type { Doc } from "../_generated/dataModel";

/**
 * getBranch — returns a single branch by ID.
 * Admin only.
 */
export const getBranch = query({
  args: { branchId: v.id("branches") },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);
    return (await ctx.db.get(args.branchId)) as Doc<"branches"> | null;
  },
});
