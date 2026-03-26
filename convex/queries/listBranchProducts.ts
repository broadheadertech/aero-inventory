import { query } from "../_generated/server";
import { v } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";
import type { Doc } from "../_generated/dataModel";

export const listBranchProducts = query({
  args: { branchId: v.id("branches") },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const branchProducts = await ctx.db
      .query("branchProducts")
      .withIndex("by_branchId", (q) => q.eq("branchId", args.branchId))
      .collect();

    return Promise.all(
      branchProducts.map(async (bp) => ({
        ...bp,
        product: (await ctx.db.get(bp.productId)) as Doc<"products"> | null,
      }))
    );
  },
});
