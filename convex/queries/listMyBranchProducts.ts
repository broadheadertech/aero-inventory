import { query } from "../_generated/server";
import { ConvexError } from "convex/values";
import { _requireAuth } from "../helpers/auth";
import type { Doc } from "../_generated/dataModel";

/**
 * listMyBranchProducts — returns branch products for the calling user's branch.
 * Accessible by: Branch Manager, Branch Staff
 * Rejected for: Admin (Admins use listBranchProducts with explicit branchId arg)
 *
 * Uses auth.branchIds[0] as the primary branch. If no branch is assigned,
 * returns an empty array (not an error).
 */
export const listMyBranchProducts = query({
  args: {},
  handler: async (ctx) => {
    const auth = await _requireAuth(ctx);

    // Admins must use the admin-scoped listBranchProducts query instead
    if (auth.role === "Admin") {
      throw new ConvexError(
        "Admins should use listBranchProducts with an explicit branchId."
      );
    }

    // If user has no branch assignment, return empty array gracefully
    if (auth.branchIds.length === 0) {
      return [];
    }

    // Use the first (primary) branch for MVP — supports multi-branch in future
    const branchId = auth.branchIds[0];

    const branchProducts = await ctx.db
      .query("branchProducts")
      .withIndex("by_branchId", (q) => q.eq("branchId", branchId))
      .collect();

    const results = await Promise.all(
      branchProducts.map(async (bp) => ({
        ...bp,
        product: (await ctx.db.get(bp.productId)) as Doc<"products"> | null,
      }))
    );

    // Sort by styleCode for consistent display order
    return results.sort((a, b) => {
      const codeA = a.product?.styleCode ?? "";
      const codeB = b.product?.styleCode ?? "";
      return codeA.localeCompare(codeB);
    });
  },
});
