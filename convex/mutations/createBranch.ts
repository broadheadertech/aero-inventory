import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

/**
 * createBranch — creates a new branch in the network.
 * Admin only. Branch code must be unique.
 */
export const createBranch = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    address: v.string(),
    phone: v.optional(v.string()),
    isActive: v.boolean(),
    type: v.optional(v.union(v.literal("branch"), v.literal("warehouse"))),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    // Normalize code server-side — client Zod transform is client-only
    const code = args.code.toUpperCase().trim();

    const existing = await ctx.db
      .query("branches")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();

    if (existing) {
      throw new ConvexError(`Branch code "${code}" is already in use.`);
    }

    // Enforce only one warehouse in the network
    if (args.type === "warehouse") {
      const existingWarehouse = await ctx.db
        .query("branches")
        .withIndex("by_type", (q) => q.eq("type", "warehouse"))
        .first();
      if (existingWarehouse) {
        throw new ConvexError(
          "A warehouse already exists. Only one warehouse is allowed in the network."
        );
      }
    }

    const now = new Date().toISOString();
    return await ctx.db.insert("branches", {
      ...args,
      code,
      createdAt: now,
      updatedAt: now,
    });
  },
});
