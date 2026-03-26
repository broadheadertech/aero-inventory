import { internalMutation } from "../_generated/server";

export const evaluateMarkdownRules = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all enabled rules
    const rules = await ctx.db
      .query("markdownRules")
      .withIndex("by_isEnabled", (q) => q.eq("isEnabled", true))
      .collect();

    if (rules.length === 0) return { proposalsCreated: 0 };

    // Get all products
    const products = await ctx.db.query("products").collect();
    const now = new Date();
    const nowIso = now.toISOString();
    let proposalsCreated = 0;

    for (const product of products) {
      // Calculate weeks on floor
      const createdAt = new Date(product.createdAt);
      const weeksOnFloor = Math.floor((now.getTime() - createdAt.getTime()) / (7 * 24 * 60 * 60 * 1000));

      // Get product classification from branchProducts (use first match)
      const branchProducts = await ctx.db
        .query("branchProducts")
        .withIndex("by_productId", (q) => q.eq("productId", product._id))
        .collect();

      if (branchProducts.length === 0) continue;

      const classification = branchProducts[0].classification;
      if (!classification) continue;

      for (const rule of rules) {
        // Check if rule matches
        if (rule.classification !== classification) continue;
        if (weeksOnFloor < rule.minWeeksOnFloor) continue;

        // Idempotency check: no duplicate pending proposal for same rule + product
        const existing = await ctx.db
          .query("markdownProposals")
          .withIndex("by_productId", (q) => q.eq("productId", product._id))
          .filter((q) =>
            q.and(
              q.eq(q.field("ruleId"), rule._id),
              q.eq(q.field("status"), "pending")
            )
          )
          .first();

        if (existing) continue;

        // Calculate margin impact
        const currentPrice = product.srpCentavos;
        const costPrice = product.costCentavos ?? Math.round(currentPrice * 0.5);
        const proposedPrice = Math.round(currentPrice * (1 - rule.markdownPercent / 100));
        const currentMargin = currentPrice > 0 ? ((currentPrice - costPrice) / currentPrice) * 100 : 0;
        const postMargin = proposedPrice > 0 ? ((proposedPrice - costPrice) / proposedPrice) * 100 : 0;

        await ctx.db.insert("markdownProposals", {
          ruleId: rule._id,
          productId: product._id,
          currentPriceCentavos: currentPrice,
          proposedPriceCentavos: proposedPrice,
          markdownPercent: rule.markdownPercent,
          currentMarginPercent: Math.round(currentMargin * 100) / 100,
          postMarkdownMarginPercent: Math.round(postMargin * 100) / 100,
          status: "pending",
          createdAt: nowIso,
        });
        proposalsCreated++;
      }
    }

    return { proposalsCreated };
  },
});
