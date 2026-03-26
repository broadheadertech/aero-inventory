import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

/**
 * updateBranch — updates an existing branch's fields.
 * Admin only. If code changes, uniqueness is re-validated.
 */
export const updateBranch = mutation({
  args: {
    branchId: v.id("branches"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const { branchId, phone: rawPhone, ...updates } = args;

    const branch = await ctx.db.get(branchId);
    if (!branch) {
      throw new ConvexError("Branch not found.");
    }

    // Normalize code server-side — client Zod transform is client-only
    if (updates.code !== undefined) {
      updates.code = updates.code.toUpperCase().trim();
    }

    // Only validate code uniqueness if code is being changed
    if (updates.code !== undefined && updates.code !== branch.code) {
      const duplicate = await ctx.db
        .query("branches")
        .withIndex("by_code", (q) => q.eq("code", updates.code!))
        .unique();
      if (duplicate) {
        throw new ConvexError(
          `Branch code "${updates.code}" is already in use.`
        );
      }
    }

    // Handle phone explicitly: empty string means "clear the field"
    const phoneValue =
      rawPhone !== undefined ? rawPhone.trim() || undefined : undefined;

    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { ...updates, updatedAt: now };
    if (rawPhone !== undefined) {
      patch.phone = phoneValue;
    }
    await ctx.db.patch(branchId, patch);
  },
});
