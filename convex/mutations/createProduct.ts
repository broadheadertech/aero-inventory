import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

/**
 * createProduct — adds a new product to the catalog.
 * Admin only. Style code must be unique.
 */
export const createProduct = mutation({
  args: {
    styleCode: v.string(),
    name: v.string(),
    department: v.string(),
    class: v.optional(v.string()),
    category: v.string(),
    subcategory: v.optional(v.string()),
    collection: v.string(),
    fabric: v.optional(v.string()),
    color: v.string(),
    printApplication: v.optional(v.string()),
    unitCost: v.number(),     // centavos
    retailPrice: v.number(),  // centavos
    isActive: v.optional(v.boolean()), // defaults to true if omitted
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    // Normalize styleCode server-side — Zod transform is client-only
    const styleCode = args.styleCode.toUpperCase().trim();

    const existing = await ctx.db
      .query("products")
      .withIndex("by_styleCode", (q) => q.eq("styleCode", styleCode))
      .unique();

    if (existing) {
      throw new ConvexError(`Style code "${styleCode}" is already in use.`);
    }

    const now = new Date().toISOString();
    return await ctx.db.insert("products", {
      ...args,
      styleCode,
      isActive: args.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });
  },
});
