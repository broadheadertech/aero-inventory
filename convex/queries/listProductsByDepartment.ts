import { query } from "../_generated/server";
import { _requireAuth } from "../helpers/auth";

/**
 * listProductsByDepartment — returns all products grouped by department.
 * Used by PNL dashboard, trends, and allocation wizard.
 */
export const listProductsByDepartment = query({
  args: {},
  handler: async (ctx) => {
    await _requireAuth(ctx);
    return await ctx.db.query("products").collect();
  },
});
