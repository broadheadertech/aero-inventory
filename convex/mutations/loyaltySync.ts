import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

/**
 * Admin configures loyalty API connection.
 * M1 note: In production, apiKey should be stored in environment variables
 * and referenced via process.env. Stored in table for demo convenience only.
 */
export const configureLoyalty = mutation({
  args: {
    apiEndpoint: v.string(),
    apiKey: v.string(),
    syncFrequencyHours: v.number(),
    isEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);
    const now = new Date().toISOString();
    const existing = await ctx.db.query("loyaltyConfig").first();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: now });
      return existing._id;
    }
    return await ctx.db.insert("loyaltyConfig", { ...args, updatedAt: now });
  },
});

/**
 * Scheduled loyalty member sync (simulated).
 * In production, would call external loyalty platform API.
 */
export const syncLoyaltyMembers = internalMutation({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db.query("loyaltyConfig").first();
    if (!config || !config.isEnabled) return { synced: 0, reason: "Loyalty sync disabled" };

    // Simulated: in production this would fetch from config.apiEndpoint
    // For demo, just update lastSyncAt
    const now = new Date().toISOString();
    await ctx.db.patch(config._id, { lastSyncAt: now });

    // Compute preferred categories for all members
    const members = await ctx.db.query("loyaltyMembers").collect();
    const products = await ctx.db.query("products").collect();
    const productCategoryMap = new Map(products.map((p) => [p._id, p.category]));

    for (const member of members) {
      const transactions = await ctx.db
        .query("loyaltyTransactions")
        .withIndex("by_memberId", (q) => q.eq("memberId", member._id))
        .collect();

      // Count categories from linked sales
      const categoryCounts: Record<string, number> = {};
      for (const txn of transactions) {
        if (txn.salesEntryId) {
          const sale = await ctx.db.get(txn.salesEntryId);
          if (sale) {
            const cat = productCategoryMap.get(sale.productId) ?? "Other";
            categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
          }
        }
      }

      const preferred = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat]) => cat);

      await ctx.db.patch(member._id, {
        preferredCategories: preferred,
        purchaseCount: transactions.length,
        syncedAt: now,
      });
    }

    return { synced: members.length };
  },
});

/**
 * Link a POS transaction to a loyalty member.
 */
export const linkTransactionToMember = mutation({
  args: {
    externalMemberId: v.string(),
    branchId: v.id("branches"),
    posTransactionId: v.optional(v.id("posTransactions")),
    salesEntryId: v.optional(v.id("salesEntries")),
    amountCentavos: v.number(),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db
      .query("loyaltyMembers")
      .withIndex("by_externalMemberId", (q) => q.eq("externalMemberId", args.externalMemberId))
      .first();

    if (!member) return null;

    const now = new Date().toISOString();
    const txnId = await ctx.db.insert("loyaltyTransactions", {
      memberId: member._id,
      salesEntryId: args.salesEntryId,
      posTransactionId: args.posTransactionId,
      branchId: args.branchId,
      amountCentavos: args.amountCentavos,
      pointsEarned: Math.floor(args.amountCentavos / 10000), // 1 point per ₱100
      createdAt: now,
    });

    await ctx.db.patch(member._id, {
      lastVisitDate: now,
      purchaseCount: member.purchaseCount + 1,
    });

    return txnId;
  },
});

/**
 * Admin adds a loyalty member manually (for demo/testing).
 */
export const addLoyaltyMember = mutation({
  args: {
    externalMemberId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    tier: v.string(),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);
    return await ctx.db.insert("loyaltyMembers", {
      ...args,
      preferredCategories: [],
      purchaseCount: 0,
      syncedAt: new Date().toISOString(),
    });
  },
});
