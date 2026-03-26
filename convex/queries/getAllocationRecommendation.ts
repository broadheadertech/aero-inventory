import { query } from "../_generated/server";
import { v } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";
import {
  _getSimilarProductHistory,
  _computeAllocationWeights,
  type AllocationRecommendation,
} from "../helpers/allocation";

/**
 * getAllocationRecommendation — compute allocation for a product across branches.
 * Admin only. Uses weighted average algorithm v1.
 */
export const getAllocationRecommendation = query({
  args: {
    productId: v.id("products"),
    totalQuantity: v.number(),
  },
  handler: async (ctx, args): Promise<AllocationRecommendation[]> => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const product = await ctx.db.get(args.productId);
    if (!product) return [];

    // Get active branches (exclude warehouse)
    const allBranches = await ctx.db.query("branches").collect();
    const activeBranches = allBranches.filter(
      (b) => b.isActive && b.type !== "warehouse"
    );

    if (activeBranches.length === 0) return [];

    // Get historical sell-thru rates per branch
    const sellThruRates = await _getSimilarProductHistory(ctx, product, activeBranches);

    // Compute weighted allocation
    const recommendations = _computeAllocationWeights(
      args.totalQuantity,
      activeBranches,
      sellThruRates
    );

    // Fill in current SOH per branch — batch with Promise.all
    const sohResults = await Promise.all(
      recommendations.map((rec) =>
        ctx.db
          .query("branchProducts")
          .withIndex("by_branchId_productId", (q) =>
            q.eq("branchId", rec.branchId).eq("productId", args.productId)
          )
          .unique()
      )
    );
    for (let i = 0; i < recommendations.length; i++) {
      recommendations[i].currentSOH = sohResults[i]?.currentSOH ?? 0;
    }

    return recommendations;
  },
});
