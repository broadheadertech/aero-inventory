import { query } from "../_generated/server";
import { _requireAuth } from "../helpers/auth";

/**
 * listAllBranches — returns all branches. Any authenticated role can access.
 * Used by role switcher and branch pickers that need to work across roles.
 */
export const listAllBranches = query({
  args: {},
  handler: async (ctx) => {
    await _requireAuth(ctx);
    return await ctx.db.query("branches").collect();
  },
});
