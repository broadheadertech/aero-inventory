import { query } from "../_generated/server";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

/**
 * listUsers — returns all user accounts with resolved branch names.
 * Admin only. Returns all users regardless of branch.
 */
export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const allUsers = await ctx.db.query("users").collect();

    // Batch-load branches into Map to avoid N+1
    const allBranches = await ctx.db.query("branches").collect();
    const branchMap = new Map(
      allBranches.map((b) => [b._id as string, b.name])
    );

    return allUsers.map((u) => ({
      ...u,
      branchNames: u.branchIds.map(
        (id: string) => branchMap.get(id) ?? "Unknown"
      ),
    }));
  },
});
