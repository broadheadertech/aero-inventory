import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

/**
 * updateUser — Admin-only mutation to update name, role, and branch assignment.
 *
 * NOTE: Email changes are out of scope (Clerk is the source of truth for email).
 * NOTE: Role changes are immediately effective for data-level access (Convex auth).
 *       Route-level (proxy.ts/Clerk JWT) takes effect on user's next login.
 */
export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    role: v.union(
      v.literal("Admin"),
      v.literal("Branch Manager"),
      v.literal("Branch Staff")
    ),
    branchIds: v.array(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    // Server-side validation
    if (args.role !== "Admin" && args.branchIds.length === 0) {
      throw new ConvexError(
        "Branch assignment is required for Branch Manager and Branch Staff roles"
      );
    }

    const existing = await ctx.db.get(args.userId);
    if (!existing) {
      throw new ConvexError("User not found");
    }

    const now = new Date().toISOString();

    await ctx.db.patch(args.userId, {
      name: args.name,
      role: args.role,
      branchIds: args.branchIds,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      actionType: "update_user",
      actor: auth.userId,
      targetTable: "users",
      targetId: args.userId,
      changes: JSON.stringify({
        name: { from: existing.name, to: args.name },
        role: { from: existing.role, to: args.role },
      }),
      details: `Updated user ${existing.email}`,
      timestamp: now,
    });
  },
});
