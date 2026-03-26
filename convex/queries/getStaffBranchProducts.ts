import { query } from "../_generated/server";
import { _requireAuth } from "../helpers/auth";

/**
 * getStaffBranchProducts — returns all products for the staff/manager's assigned branch.
 * Includes product details (name, styleCode, price, category, etc.) joined with branchProduct stock data.
 */
export const getStaffBranchProducts = query({
  args: {},
  handler: async (ctx) => {
    const auth = await _requireAuth(ctx);

    // Get user's first assigned branch
    const branchId = auth.branchIds?.[0];
    if (!branchId) return [];

    const branchProducts = await ctx.db
      .query("branchProducts")
      .withIndex("by_branchId", (q) => q.eq("branchId", branchId))
      .collect();

    const results = [];
    for (const bp of branchProducts) {
      const product = await ctx.db.get(bp.productId);
      if (!product || !product.isActive) continue;

      results.push({
        branchProductId: bp._id,
        productId: bp.productId,
        styleCode: product.styleCode,
        productName: product.name,
        department: product.department,
        category: product.category,
        collection: product.collection,
        color: product.color,
        fabric: product.fabric ?? null,
        imageUrl: product.imageUrl ?? null,
        retailPrice: product.retailPrice,
        beginningStock: bp.beginningStock,
        currentSOH: bp.currentSOH,
        deliveryInStoreDate: bp.deliveryInStoreDate ?? null,
      });
    }

    return results;
  },
});
