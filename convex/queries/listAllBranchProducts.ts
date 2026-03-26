import { query } from "../_generated/server";
import { _requireAuth, _assertAdmin } from "../helpers/auth";
import type { Doc } from "../_generated/dataModel";

export const listAllBranchProducts = query({
  args: {},
  handler: async (ctx) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const branchProducts = await ctx.db.query("branchProducts").collect();

    const results = await Promise.all(
      branchProducts.map(async (bp) => {
        const product = (await ctx.db.get(bp.productId)) as Doc<"products"> | null;
        const branch = (await ctx.db.get(bp.branchId)) as Doc<"branches"> | null;
        return {
          ...bp,
          product,
          branch,
          totalSold: bp.beginningStock - bp.currentSOH,
        };
      })
    );

    return results.sort((a, b) => {
      const branchA = a.branch?.name ?? "";
      const branchB = b.branch?.name ?? "";
      const branchCmp = branchA.localeCompare(branchB);
      if (branchCmp !== 0) return branchCmp;
      return (a.product?.styleCode ?? "").localeCompare(b.product?.styleCode ?? "");
    });
  },
});
