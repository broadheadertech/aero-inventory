import { query } from "../_generated/server";
import { v } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

export const listMarkdownProposals = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    let proposals;
    if (args.status) {
      proposals = await ctx.db
        .query("markdownProposals")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      proposals = await ctx.db.query("markdownProposals").collect();
    }

    // Enrich with product names and rule names
    const enriched = await Promise.all(
      proposals.map(async (p) => {
        const product = await ctx.db.get(p.productId);
        const rule = await ctx.db.get(p.ruleId);
        return {
          ...p,
          productName: product?.name ?? "Unknown",
          productSku: product?.sku ?? "",
          ruleName: rule?.name ?? "Deleted Rule",
        };
      })
    );

    return enriched.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
});
