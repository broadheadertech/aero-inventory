import { query } from "../_generated/server";
import { v } from "convex/values";
import { _requireAuth } from "../helpers/auth";

export const listLoyaltyMembers = query({
  args: { branchId: v.optional(v.id("branches")) },
  handler: async (ctx, args) => {
    await _requireAuth(ctx);
    const members = await ctx.db.query("loyaltyMembers").collect();

    if (!args.branchId) return members.sort((a, b) => b.purchaseCount - a.purchaseCount);

    // Filter to members who have transactions at this branch
    const branchTxns = await ctx.db
      .query("loyaltyTransactions")
      .withIndex("by_branchId", (q) => q.eq("branchId", args.branchId!))
      .collect();

    const memberIds = new Set(branchTxns.map((t) => t.memberId));
    return members
      .filter((m) => memberIds.has(m._id))
      .sort((a, b) => b.purchaseCount - a.purchaseCount);
  },
});

export const loyaltyAnalytics = query({
  args: {},
  handler: async (ctx) => {
    await _requireAuth(ctx);
    const members = await ctx.db.query("loyaltyMembers").collect();
    const transactions = await ctx.db.query("loyaltyTransactions").collect();

    const tierCounts: Record<string, number> = {};
    for (const m of members) {
      tierCounts[m.tier] = (tierCounts[m.tier] ?? 0) + 1;
    }

    const totalSpend = transactions.reduce((sum, t) => sum + t.amountCentavos, 0);
    const activeMembers = members.filter((m) => m.purchaseCount > 0).length;

    return {
      totalMembers: members.length,
      activeMembers,
      activeRate: members.length > 0 ? Math.round((activeMembers / members.length) * 100) : 0,
      totalSpend,
      avgSpendPerMember: members.length > 0 ? Math.round(totalSpend / members.length) : 0,
      tierBreakdown: Object.entries(tierCounts).map(([tier, count]) => ({ tier, count })),
    };
  },
});

export const getLoyaltyConfig = query({
  args: {},
  handler: async (ctx) => {
    await _requireAuth(ctx);
    return await ctx.db.query("loyaltyConfig").first();
  },
});
