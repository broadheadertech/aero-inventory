import { internalMutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";

/**
 * createUserRecord — internal mutation called only from createUser action.
 *
 * Creates the Convex users record and writes an auditLogs entry.
 * Not callable from the client — action-only path.
 */
export const createUserRecord = internalMutation({
  args: {
    clerkUserId: v.string(),
    email: v.string(),
    name: v.string(),
    role: v.union(
      v.literal("Admin"),
      v.literal("Branch Manager"),
      v.literal("Branch Staff")
    ),
    branchIds: v.array(v.id("branches")),
    actorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Guard: email must be unique
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existing) {
      throw new ConvexError(
        `A user with email "${args.email}" already exists.`
      );
    }

    const now = new Date().toISOString();

    const newUserId = await ctx.db.insert("users", {
      clerkUserId: args.clerkUserId,
      email: args.email,
      name: args.name,
      role: args.role,
      branchIds: args.branchIds,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      actionType: "create_user",
      actor: args.actorId,
      targetTable: "users",
      targetId: newUserId,
      details: `Created user ${args.email} with role ${args.role}`,
      timestamp: now,
    });

    return newUserId;
  },
});
