import { query } from "../_generated/server";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

export const listReorderRules = query({
  args: {},
  handler: async (ctx) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const rules = await ctx.db.query("reorderRules").collect();

    const enriched = await Promise.all(
      rules.map(async (rule) => {
        const product = await ctx.db.get(rule.productId);
        const supplier = await ctx.db.get(rule.supplierId);
        return {
          ...rule,
          productName: product?.name ?? "Unknown",
          productSku: product?.styleCode ?? "",
          supplierName: supplier?.name ?? "Unknown",
          supplierLeadTime: supplier?.leadTimeDays ?? 0,
        };
      })
    );

    return enriched;
  },
});
