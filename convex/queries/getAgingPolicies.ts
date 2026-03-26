import { query } from "../_generated/server";
import { _requireAuth } from "../helpers/auth";

export const getAgingPolicies = query({
  args: {},
  handler: async (ctx) => {
    await _requireAuth(ctx);
    const policies = await ctx.db.query("agingPolicies").collect();
    return policies.sort((a, b) => a.priority - b.priority);
  },
});
