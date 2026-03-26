import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

/**
 * checkEmailExists — internal query for pre-validating email uniqueness in the
 * createUser action BEFORE calling the Clerk Backend API.
 *
 * Preventing orphaned Clerk users: if we call Clerk first and then the Convex
 * insert fails, the Clerk account exists but _requireAuth will always throw
 * "User not found". This pre-check fails fast before any external call.
 */
export const checkEmailExists = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    return user !== null;
  },
});
