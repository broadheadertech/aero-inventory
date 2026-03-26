import { query } from "../_generated/server";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

/**
 * listSuppliers2 — returns all suppliers sorted by name.
 * Admin only. Named listSuppliers2 to avoid conflict with any existing query.
 */
export const listSuppliers2 = query({
  args: {},
  handler: async (ctx) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const suppliers = await ctx.db
      .query("suppliers")
      .withIndex("by_name")
      .collect();

    return suppliers;
  },
});
