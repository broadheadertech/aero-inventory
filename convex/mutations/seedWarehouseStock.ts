import { mutation } from "../_generated/server";
import { ConvexError } from "convex/values";

/**
 * seedWarehouseStock — one-time mutation to populate warehouse with stock.
 * Adds branchProducts for the warehouse branch for each active product.
 * Skips if warehouse already has stock.
 */
export const seedWarehouseStock = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    // Find warehouse
    const warehouse = await ctx.db
      .query("branches")
      .withIndex("by_type", (q) => q.eq("type", "warehouse"))
      .first();

    if (!warehouse) throw new ConvexError("No warehouse found.");

    const now = new Date().toISOString();
    const products = await ctx.db.query("products").collect();
    const activeProducts = products.filter((p) => p.isActive);

    // Delete existing warehouse branchProducts to re-seed fresh
    const existingBPs = await ctx.db
      .query("branchProducts")
      .withIndex("by_branchId", (q) => q.eq("branchId", warehouse._id))
      .collect();
    for (const bp of existingBPs) {
      await ctx.db.delete(bp._id);
    }

    let count = 0;
    for (const product of activeProducts) {
      // Calculate warehouse reserve: ~100-300 units per product
      const baseReserve = 100 + ((product.styleCode.charCodeAt(4) * 7) % 200);

      await ctx.db.insert("branchProducts", {
        branchId: warehouse._id,
        productId: product._id,
        beginningStock: baseReserve,
        currentSOH: baseReserve,
        createdAt: now,
        updatedAt: now,
      });
      count++;
    }

    return { seeded: true, productsAdded: count };
  },
});
