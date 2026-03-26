import { query } from "../_generated/server";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

/**
 * listBranches — returns all branches in the network.
 * Admin only: Branch Managers and Staff do not access branch management.
 */
export const listBranches = query({
  args: {},
  handler: async (ctx) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);
    return await ctx.db.query("branches").collect();
  },
});
