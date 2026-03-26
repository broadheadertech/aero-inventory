import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

/**
 * updateProduct — updates an existing product's fields.
 * Admin only. If styleCode changes, uniqueness is re-validated.
 */
export const updateProduct = mutation({
  args: {
    productId: v.id("products"),
    styleCode: v.optional(v.string()),
    name: v.optional(v.string()),
    department: v.optional(v.string()),
    // Accept "" to explicitly clear the field (undefined = field not sent, "" = clear it)
    class: v.optional(v.union(v.string(), v.literal(""))),
    category: v.optional(v.string()),
    subcategory: v.optional(v.union(v.string(), v.literal(""))),
    collection: v.optional(v.string()),
    fabric: v.optional(v.union(v.string(), v.literal(""))),
    color: v.optional(v.string()),
    printApplication: v.optional(v.union(v.string(), v.literal(""))),
    unitCost: v.optional(v.number()),
    retailPrice: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const { productId, ...rawUpdates } = args;

    const product = await ctx.db.get(productId);
    if (!product) {
      throw new ConvexError("Product not found.");
    }

    // Normalize styleCode server-side
    if (rawUpdates.styleCode !== undefined) {
      rawUpdates.styleCode = rawUpdates.styleCode.toUpperCase().trim();
    }

    // Only validate uniqueness if styleCode is actually changing
    if (rawUpdates.styleCode !== undefined && rawUpdates.styleCode !== product.styleCode) {
      const duplicate = await ctx.db
        .query("products")
        .withIndex("by_styleCode", (q) => q.eq("styleCode", rawUpdates.styleCode!))
        .unique();
      if (duplicate) {
        throw new ConvexError(`Style code "${rawUpdates.styleCode}" is already in use.`);
      }
    }

    const now = new Date().toISOString();
    // Build explicit patch: convert "" → undefined (field removal) for clearable optional strings
    const clearableFields = new Set(["class", "subcategory", "fabric", "printApplication"]);
    const patch: Record<string, unknown> = { updatedAt: now };
    for (const [key, value] of Object.entries(rawUpdates)) {
      patch[key] = clearableFields.has(key) && value === "" ? undefined : value;
    }
    await ctx.db.patch(productId, patch);
  },
});
