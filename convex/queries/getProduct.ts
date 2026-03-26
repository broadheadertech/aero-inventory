import { query } from "../_generated/server";
import { v } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";
import type { Doc } from "../_generated/dataModel";

/**
 * getProduct — returns a single product by ID.
 * Admin only.
 */
export const getProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);
    return (await ctx.db.get(args.productId)) as Doc<"products"> | null;
  },
});
