import { query } from "../_generated/server";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

export type MarginErosionProduct = {
  productId: string;
  styleCode: string;
  name: string;
  department: string;
  originalSRP: number;
  currentSRP: number;
  srpDropPercent: number;
  cost: number;
  currentMarginPercent: number;
};

/**
 * getMarginErosion — returns products where Current SRP has dropped from original SRP.
 * Admin only. Sorted by largest drop first.
 */
export const getMarginErosion = query({
  args: {},
  handler: async (ctx): Promise<MarginErosionProduct[]> => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const products = await ctx.db
      .query("products")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    // Get branchProducts to find current selling prices
    const branchProducts = await ctx.db.query("branchProducts").collect();

    const erosion: MarginErosionProduct[] = [];

    for (const product of products) {
      // Find lowest current SRP across branches (worst case erosion)
      const bps = branchProducts.filter((bp) => bp.productId === product._id);
      if (bps.length === 0) continue;

      // Use product's retail price as original SRP
      const originalSRP = product.retailPrice;

      // For now, use the product's retail price as baseline
      // In a real scenario, branchProducts might have a currentSRP field
      // Check if any markdown has been applied by looking at sale prices
      const salesEntries = await ctx.db
        .query("salesEntries")
        .withIndex("by_productId", (q) => q.eq("productId", product._id))
        .collect();

      if (salesEntries.length === 0) continue;

      // Find the most recent sale price as "current SRP"
      const recentEntries = salesEntries.sort((a, b) => b.enteredAt.localeCompare(a.enteredAt));
      const currentSRP = recentEntries[0].salePrice;

      if (currentSRP >= originalSRP) continue; // No erosion

      const srpDropPercent = Math.round(((originalSRP - currentSRP) / originalSRP) * 100 * 100) / 100;
      const currentMarginPercent = product.unitCost > 0
        ? Math.round(((currentSRP - product.unitCost) / currentSRP) * 100 * 100) / 100
        : 0;

      erosion.push({
        productId: product._id,
        styleCode: product.styleCode,
        name: product.name,
        department: product.department,
        originalSRP,
        currentSRP,
        srpDropPercent,
        cost: product.unitCost,
        currentMarginPercent,
      });
    }

    // Sort by largest drop first
    erosion.sort((a, b) => b.srpDropPercent - a.srpDropPercent);

    return erosion;
  },
});
