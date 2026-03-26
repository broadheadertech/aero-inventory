import type { QueryCtx } from "../_generated/server";
import type { Id, Doc } from "../_generated/dataModel";

export type AllocationRecommendation = {
  branchId: Id<"branches">;
  branchName: string;
  recommendedQty: number;
  sellThruRate: number;
  currentSOH: number;
  justification: string;
};

/**
 * _getSimilarProductHistory — compute sell-thru rate per branch for similar products.
 * Similar = same department + category. Uses last 3 months of sales data.
 */
export async function _getSimilarProductHistory(
  ctx: QueryCtx,
  product: Doc<"products">,
  activeBranches: Doc<"branches">[]
): Promise<Map<string, number>> {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const startDate = threeMonthsAgo.toISOString();

  // Find similar products (same dept + category)
  const similarProducts = await ctx.db
    .query("products")
    .withIndex("by_department", (q) => q.eq("department", product.department))
    .collect();
  const sameCategoryIds = new Set(
    similarProducts
      .filter((p) => p.category === product.category && p.isActive)
      .map((p) => p._id as string)
  );

  // Get sales entries for similar products using by_productId index per product
  const relevantEntries = [];
  for (const pId of sameCategoryIds) {
    const pEntries = await ctx.db
      .query("salesEntries")
      .withIndex("by_productId", (q) => q.eq("productId", pId as Id<"products">))
      .collect();
    relevantEntries.push(...pEntries.filter((e) => e.enteredAt >= startDate));
  }

  // Compute sell-thru rate per branch
  const branchSales = new Map<string, number>();
  const branchBeg = new Map<string, number>();

  for (const entry of relevantEntries) {
    branchSales.set(
      entry.branchId,
      (branchSales.get(entry.branchId) ?? 0) + entry.quantitySold
    );
  }

  // Get BEG values for similar products at each branch
  const branchIds = activeBranches.map((b) => b._id);
  for (const bId of branchIds) {
    const bps = await ctx.db
      .query("branchProducts")
      .withIndex("by_branchId", (q) => q.eq("branchId", bId))
      .collect();
    const similarBPs = bps.filter((bp) => sameCategoryIds.has(bp.productId));
    const totalBeg = similarBPs.reduce((sum, bp) => sum + bp.beginningStock, 0);
    branchBeg.set(bId, totalBeg);
  }

  // Compute sell-thru rate: sold / beg
  const rates = new Map<string, number>();
  for (const branch of activeBranches) {
    const sold = branchSales.get(branch._id) ?? 0;
    const beg = branchBeg.get(branch._id) ?? 0;
    const rate = beg > 0 ? (sold / beg) * 100 : 0;
    rates.set(branch._id, Math.round(rate * 100) / 100);
  }

  return rates;
}

/**
 * _computeAllocationWeights — compute recommended quantities using weighted average.
 * Fallback: equal distribution when no historical data.
 */
export function _computeAllocationWeights(
  totalQuantity: number,
  branches: Doc<"branches">[],
  sellThruRates: Map<string, number>
): AllocationRecommendation[] {
  const totalRate = Array.from(sellThruRates.values()).reduce((sum, r) => sum + r, 0);
  const useEqualDistribution = totalRate === 0;

  const recommendations: AllocationRecommendation[] = [];
  let allocated = 0;

  for (let i = 0; i < branches.length; i++) {
    const branch = branches[i];
    const rate = sellThruRates.get(branch._id) ?? 0;

    let qty: number;
    let justification: string;

    if (useEqualDistribution) {
      qty = Math.floor(totalQuantity / branches.length);
      justification = "Equal distribution (no historical data)";
    } else {
      const weight = rate / totalRate;
      qty = Math.round(totalQuantity * weight);
      const pct = Math.round(weight * 100);
      justification = `${pct}% weight based on ${rate}% sell-thru rate`;
    }

    // Last branch gets remainder to ensure total matches (clamped to 0)
    if (i === branches.length - 1) {
      qty = Math.max(0, totalQuantity - allocated);
    }

    allocated += qty;

    recommendations.push({
      branchId: branch._id,
      branchName: branch.name,
      recommendedQty: qty,
      sellThruRate: rate,
      currentSOH: 0, // Will be filled by the query
      justification,
    });
  }

  return recommendations;
}
