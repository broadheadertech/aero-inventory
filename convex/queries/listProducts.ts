import { query } from "../_generated/server";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

/**
 * listProducts — returns all products in the catalog.
 * Admin only.
 */
export const listProducts = query({
  args: {},
  handler: async (ctx) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);
    return await ctx.db.query("products").collect();
  },
});
