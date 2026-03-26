import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

export const assignBranchProduct = mutation({
  args: {
    branchId: v.id("branches"),
    productId: v.id("products"),
    beginningStock: v.number(),                  // whole units
    deliveryInStoreDate: v.optional(v.string()), // ISO 8601 date string
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    if (!Number.isInteger(args.beginningStock) || args.beginningStock < 0) {
      throw new ConvexError(
        "Beginning stock must be a non-negative whole number."
      );
    }

    const branch = await ctx.db.get(args.branchId);
    if (!branch) throw new ConvexError("Branch not found.");

    const product = await ctx.db.get(args.productId);
    if (!product) throw new ConvexError("Product not found.");

    // Uniqueness: each product can only be assigned once per branch
    const existing = await ctx.db
      .query("branchProducts")
      .withIndex("by_branchId_productId", (q) =>
        q.eq("branchId", args.branchId)
      )
      .filter((q) => q.eq(q.field("productId"), args.productId))
      .unique();

    if (existing) {
      throw new ConvexError(
        `"${product.styleCode}" is already assigned to this branch.`
      );
    }

    const now = new Date().toISOString();
    return await ctx.db.insert("branchProducts", {
      branchId: args.branchId,
      productId: args.productId,
      beginningStock: args.beginningStock,
      currentSOH: args.beginningStock, // SOH initialized to BEG
      deliveryInStoreDate: args.deliveryInStoreDate,
      createdAt: now,
      updatedAt: now,
    });
  },
});
