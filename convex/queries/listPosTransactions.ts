import { query } from "../_generated/server";
import { v } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

export const listPosTransactions = query({
  args: {
    branchId: v.optional(v.id("branches")),
    syncStatus: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const takeCount = args.limit ?? 100;

    let limited;

    if (args.syncStatus && args.branchId) {
      // M1+L1 fix: use index + filter + take instead of collect + slice
      limited = await ctx.db
        .query("posTransactions")
        .withIndex("by_branchId", (q) => q.eq("branchId", args.branchId!))
        .filter((q) => q.eq(q.field("syncStatus"), args.syncStatus!))
        .order("desc")
        .take(takeCount);
    } else if (args.syncStatus) {
      limited = await ctx.db
        .query("posTransactions")
        .withIndex("by_syncStatus", (q) => q.eq("syncStatus", args.syncStatus!))
        .order("desc")
        .take(takeCount);
    } else if (args.branchId) {
      limited = await ctx.db
        .query("posTransactions")
        .withIndex("by_branchId", (q) => q.eq("branchId", args.branchId!))
        .order("desc")
        .take(takeCount);
    } else {
      limited = await ctx.db
        .query("posTransactions")
        .withIndex("by_createdAt")
        .order("desc")
        .take(takeCount);
    }

    // Enrich with product and branch names
    const enriched = await Promise.all(
      limited.map(async (t) => {
        const product = t.productId ? await ctx.db.get(t.productId) : null;
        const branch = await ctx.db.get(t.branchId);
        return {
          ...t,
          productName: product?.name ?? "Unknown",
          branchName: branch?.name ?? "Unknown",
        };
      })
    );

    return enriched;
  },
});
