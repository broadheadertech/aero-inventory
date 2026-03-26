import type { MutationCtx } from "../_generated/server";
import type { Id, Doc } from "../_generated/dataModel";

/**
 * _computeADS — compute Average Daily Sales for a product at a branch.
 * Uses last 30 days of sales data.
 */
async function _computeADS(
  ctx: MutationCtx,
  branchId: Id<"branches">,
  productId: Id<"products">
): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startDate = thirtyDaysAgo.toISOString();

  // Use by_productId index for targeted query, then filter by branch + date in memory
  const allProductEntries = await ctx.db
    .query("salesEntries")
    .withIndex("by_productId", (q) => q.eq("productId", productId))
    .collect();

  const productEntries = allProductEntries.filter(
    (e) => e.branchId === branchId && e.enteredAt >= startDate
  );

  if (productEntries.length === 0) return 0;

  const totalSold = productEntries.reduce((sum, e) => sum + e.quantitySold, 0);

  // Compute actual days span
  const dates = productEntries.map((e) => new Date(e.enteredAt).getTime());
  const firstDate = Math.min(...dates);
  const lastDate = Math.max(...dates);
  const daySpan = Math.max(1, Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)));

  return totalSold / daySpan;
}

/**
 * _evaluateReplenishmentRules — check all enabled rules after a sales entry.
 * Creates suggestions when SOH drops below threshold.
 * Idempotent: won't create duplicate pending suggestions.
 */
export async function _evaluateReplenishmentRules(
  ctx: MutationCtx,
  branchId: Id<"branches">,
  productId: Id<"products">,
  currentSOH: number
): Promise<void> {
  // Fetch enabled rules
  const enabledRules = await ctx.db
    .query("replenishmentRules")
    .withIndex("by_isEnabled", (q) => q.eq("isEnabled", true))
    .collect();

  if (enabledRules.length === 0) return;

  // Get product info for scope matching
  const product = await ctx.db.get(productId);
  if (!product) return;

  // Compute ADS once for this product+branch
  const ads = await _computeADS(ctx, branchId, productId);
  if (ads <= 0) return; // No sales history — can't compute days of stock

  const daysOfStock = currentSOH / ads;

  // Fetch pending suggestions once for idempotency checks (not per rule)
  const pendingSuggestions = await ctx.db
    .query("replenishmentSuggestions")
    .withIndex("by_branchId_status", (q) =>
      q.eq("branchId", branchId).eq("status", "pending")
    )
    .collect();
  const pendingForProduct = pendingSuggestions.filter((s) => s.productId === productId);

  for (const rule of enabledRules) {
    // Check if product matches rule scope
    if (!_matchesScope(rule, product)) continue;

    // Check if threshold is crossed
    if (daysOfStock >= rule.thresholdDays) continue;

    // Idempotency check
    if (pendingForProduct.some((s) => s.ruleId === rule._id)) continue;

    // Create suggestion
    const suggestedQuantity = Math.ceil(ads * rule.coverageDays);
    const now = new Date().toISOString();

    await ctx.db.insert("replenishmentSuggestions", {
      ruleId: rule._id,
      branchId,
      productId,
      currentSOH,
      currentADS: Math.round(ads * 100) / 100,
      suggestedQuantity,
      status: "pending",
      createdAt: now,
    });
  }
}

/**
 * _matchesScope — check if a product matches a rule's scope filter.
 */
function _matchesScope(
  rule: Doc<"replenishmentRules">,
  product: Doc<"products">
): boolean {
  if (rule.scope === "all") return true;

  if (rule.scope === "category" && rule.scopeFilter) {
    if (rule.scopeFilter.department && product.department !== rule.scopeFilter.department) {
      return false;
    }
    if (rule.scopeFilter.category && product.category !== rule.scopeFilter.category) {
      return false;
    }
    return true;
  }

  if (rule.scope === "specific" && rule.scopeFilter?.productIds) {
    return (rule.scopeFilter.productIds as string[]).includes(product._id);
  }

  return false;
}
