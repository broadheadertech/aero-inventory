import { query } from "../_generated/server";
import { _requireAuth } from "../helpers/auth";

/**
 * getCurrentUser — returns the authenticated user's own record.
 *
 * CANONICAL PATTERN for all Epic 2+ queries:
 *
 *   const auth = await _requireAuth(ctx);
 *
 *   if (auth.role === "Admin") {
 *     // No branch filter — return all data
 *   } else {
 *     // Filter by auth.branchIds
 *     for (const branchId of auth.branchIds) { ... }
 *   }
 *
 * This query verifies _requireAuth works end-to-end and is safe to call
 * from any authenticated role (returns own data only).
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const auth = await _requireAuth(ctx);
    return await ctx.db.get(auth.userId);
  },
});
