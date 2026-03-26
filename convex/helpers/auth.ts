import type { QueryCtx, MutationCtx } from "../_generated/server";
import { ConvexError } from "convex/values";
import type { Id, Doc } from "../_generated/dataModel";

export type AuthContext = {
  userId: Id<"users">;
  role: "Admin" | "Branch Manager" | "Branch Staff";
  branchIds: Id<"branches">[];
};

/**
 * _requireAuth — shared auth guard for ALL Convex queries and mutations.
 *
 * Pattern for every Convex function:
 *   const auth = await _requireAuth(ctx);
 *   // Branch Managers: filter by auth.branchIds
 *   // Admins: no branch filter
 *
 * Throws ConvexError if:
 *   - No Clerk session (unauthenticated)
 *   - User not found in Convex users table (not yet synced)
 *   - User account is deactivated
 */
export async function _requireAuth(
  ctx: QueryCtx | MutationCtx
): Promise<AuthContext> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError("Unauthenticated");
  }

  const user = (await ctx.db
    .query("users")
    .withIndex("by_clerkUserId", (q) =>
      q.eq("clerkUserId", identity.subject)
    )
    .unique()) as Doc<"users"> | null;

  if (!user) {
    throw new ConvexError(
      "User not found. Please contact your administrator."
    );
  }

  if (!user.isActive) {
    throw new ConvexError("Account is deactivated.");
  }

  return {
    userId: user._id,
    role: user.role,
    branchIds: user.branchIds,
  };
}

/**
 * _assertAdmin — throws if the caller is not an Admin.
 * Use before any admin-only operation.
 */
export function _assertAdmin(auth: AuthContext): void {
  if (auth.role !== "Admin") {
    throw new ConvexError("Forbidden: Admin access required");
  }
}

/**
 * _assertBranchAccess — enforces branch-scoped access.
 * Admins pass through unconditionally.
 * Branch Managers and Staff must have the branchId in their assigned list.
 */
export function _assertBranchAccess(
  auth: AuthContext,
  branchId: Id<"branches">
): void {
  if (auth.role === "Admin") return;
  if (!auth.branchIds.includes(branchId)) {
    throw new ConvexError(
      "Forbidden: You do not have access to this branch"
    );
  }
}
