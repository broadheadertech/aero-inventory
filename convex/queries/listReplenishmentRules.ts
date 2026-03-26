import { query } from "../_generated/server";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

/**
 * listReplenishmentRules — returns all replenishment rules with pending suggestion counts.
 * Admin only.
 */
export const listReplenishmentRules = query({
  args: {},
  handler: async (ctx) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const rules = await ctx.db.query("replenishmentRules").collect();

    // Get pending suggestion counts per rule
    const pendingSuggestions = await ctx.db
      .query("replenishmentSuggestions")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const countByRule = new Map<string, number>();
    for (const s of pendingSuggestions) {
      countByRule.set(s.ruleId, (countByRule.get(s.ruleId) ?? 0) + 1);
    }

    return rules.map((rule) => ({
      ...rule,
      pendingSuggestionCount: countByRule.get(rule._id) ?? 0,
    }));
  },
});
