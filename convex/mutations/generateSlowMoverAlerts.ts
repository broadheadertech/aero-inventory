import { internalMutation } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import {
  _calculateSellThru,
  _classify,
  _getThresholds,
} from "../helpers/sellThru";

const DEFAULT_ALERT_SETTINGS = {
  minWeeksOnFloor: 4,
  minBranchesForNetworkAlert: 3,
  alertFrequency: "once" as const,
};

type SlowProductEntry = {
  branchIds: Id<"branches">[];
  sellThruPercents: number[];
  styleCode: string;
  productName: string;
};

/**
 * generateSlowMoverAlerts — scans all branchProducts, detects Slow movers,
 * and creates in-app notifications for Branch Managers and Admins.
 * Called by cron (convex/crons.ts). Internal — no user auth context.
 */
export const generateSlowMoverAlerts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();

    // Load alert settings (fall back to defaults if not configured)
    const alertSettings =
      (await ctx.db.query("alertSettings").first()) ?? DEFAULT_ALERT_SETTINGS;

    // Load sell-thru thresholds (weekly period for slow mover detection)
    const thresholds = await _getThresholds(ctx, "weekly");

    // Scan all branchProducts
    const allBranchProducts = await ctx.db.query("branchProducts").collect();

    // Hoist user queries — avoids N+1 per slow product
    const allBranchManagers = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "Branch Manager"))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const admins = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "Admin"))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Track slow products per productId for network alert detection
    const slowByProduct = new Map<Id<"products">, SlowProductEntry>();

    for (const bp of allBranchProducts) {
      // Skip warehouse and inactive branches
      const branch = await ctx.db.get(bp.branchId);
      if (!branch || !branch.isActive || branch.type === "warehouse") continue;

      const product = await ctx.db.get(bp.productId);
      if (!product || !product.isActive) continue;

      const sellThru = _calculateSellThru(bp.beginningStock, bp.currentSOH);
      if (!sellThru) continue;

      const classification = _classify(
        sellThru.sellThruPercent,
        thresholds.fastThreshold,
        thresholds.slowThreshold
      );
      if (classification !== "Slow") continue;

      // Compute weeks on floor
      const weeksOnFloor = bp.deliveryInStoreDate
        ? Math.floor(
            (Date.now() - new Date(bp.deliveryInStoreDate).getTime()) /
              (7 * 24 * 60 * 60 * 1000)
          )
        : null;

      if (weeksOnFloor === null || weeksOnFloor < alertSettings.minWeeksOnFloor)
        continue;

      // Dedup: check most recent slow_mover notification for this product-branch
      const existing = await ctx.db
        .query("notifications")
        .withIndex("by_productId_branchId", (q) =>
          q.eq("productId", bp.productId)
        )
        .filter((q) =>
          q.and(
            q.eq(q.field("branchId"), bp.branchId),
            q.eq(q.field("type"), "slow_mover")
          )
        )
        .order("desc")
        .first();

      if (existing) {
        if (alertSettings.alertFrequency === "once") continue;
        // "weekly": re-alert only if most recent notification is >7 days old
        const sevenDaysAgo = new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toISOString();
        if (existing.createdAt > sevenDaysAgo) continue;
      }

      const branchManagers = allBranchManagers.filter((u) =>
        u.branchIds.includes(bp.branchId)
      );

      const message = `${product.styleCode} — ${product.name} at ${branch.name}: ${sellThru.sellThruPercent}% sell-thru, ${weeksOnFloor} week(s) on floor`;

      for (const manager of branchManagers) {
        await ctx.db.insert("notifications", {
          userId: manager._id,
          type: "slow_mover",
          title: "Slow Mover Alert",
          message,
          productId: bp.productId,
          branchId: bp.branchId,
          isRead: false,
          createdAt: now,
        });
      }

      // Accumulate for network alert check
      const entry: SlowProductEntry = slowByProduct.get(bp.productId) ?? {
        branchIds: [],
        sellThruPercents: [],
        styleCode: product.styleCode,
        productName: product.name,
      };
      entry.branchIds.push(bp.branchId);
      entry.sellThruPercents.push(sellThru.sellThruPercent);
      slowByProduct.set(bp.productId, entry);
    }

    // Network alert: product Slow across N+ branches
    for (const [productId, data] of slowByProduct) {
      if (data.branchIds.length < alertSettings.minBranchesForNetworkAlert)
        continue;

      // Dedup: check most recent network_slow_mover notification for this product
      const existingNetwork = await ctx.db
        .query("notifications")
        .withIndex("by_productId_branchId", (q) =>
          q.eq("productId", productId)
        )
        .filter((q) => q.eq(q.field("type"), "network_slow_mover"))
        .order("desc")
        .first();

      if (existingNetwork) {
        if (alertSettings.alertFrequency === "once") continue;
        const sevenDaysAgo = new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toISOString();
        if (existingNetwork.createdAt > sevenDaysAgo) continue;
      }

      const avgSellThru =
        Math.round(
          (data.sellThruPercents.reduce((a, b) => a + b, 0) /
            data.sellThruPercents.length) *
            10
        ) / 10;

      const networkMessage = `${data.styleCode} — ${data.productName} is Slow across ${data.branchIds.length} branch(es). Avg sell-thru: ${avgSellThru}%`;

      for (const admin of admins) {
        await ctx.db.insert("notifications", {
          userId: admin._id,
          type: "network_slow_mover",
          title: "Network Slow Mover Alert",
          message: networkMessage,
          productId,
          isRead: false,
          createdAt: now,
        });
      }
    }
  },
});
