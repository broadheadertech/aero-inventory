import { query } from "../_generated/server";
import { v } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";
import { _aggregatePnL, _aggregatePnLByDimension } from "../helpers/pnl";
import type { Doc } from "../_generated/dataModel";

/**
 * getNetworkPnL — returns network-wide P&L summary and breakdown by dimension.
 * Admin only.
 */
export const getNetworkPnL = query({
  args: {
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    branchId: v.optional(v.id("branches")),
    department: v.optional(v.string()),
    category: v.optional(v.string()),
    collection: v.optional(v.string()),
    dimension: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    // Get sales entries with optional date filtering
    let entries = await ctx.db.query("salesEntries").collect();

    if (args.startDate) {
      entries = entries.filter((e) => e.enteredAt >= args.startDate!);
    }
    if (args.endDate) {
      entries = entries.filter((e) => e.enteredAt <= args.endDate!);
    }
    if (args.branchId) {
      entries = entries.filter((e) => e.branchId === args.branchId);
    }

    // Build product map
    const allProducts = await ctx.db.query("products").collect();
    const productMap = new Map<string, Doc<"products">>(
      allProducts.map((p) => [p._id, p])
    );

    // Filter by product attributes
    if (args.department || args.category || args.collection) {
      const validProductIds = new Set<string>();
      for (const p of allProducts) {
        if (args.department && p.department !== args.department) continue;
        if (args.category && p.category !== args.category) continue;
        if (args.collection && p.collection !== args.collection) continue;
        validProductIds.add(p._id);
      }
      entries = entries.filter((e) => validProductIds.has(e.productId));
    }

    // Compute summary
    const summary = _aggregatePnL(entries, productMap);

    // Compute breakdown if dimension specified
    let breakdown = undefined;
    if (args.dimension) {
      const allBranches = await ctx.db.query("branches").collect();
      const branchMap = new Map<string, Doc<"branches">>(
        allBranches.map((b) => [b._id, b])
      );
      breakdown = _aggregatePnLByDimension(
        entries,
        productMap,
        branchMap,
        args.dimension as "department" | "category" | "collection" | "branch"
      );
    }

    return { summary, breakdown };
  },
});
