import { query } from "../_generated/server";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

export const posSyncStatus = query({
  args: {},
  handler: async (ctx) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const configs = await ctx.db.query("posConfig").collect();
    const branches = await ctx.db.query("branches").collect();

    const statuses = await Promise.all(
      configs.map(async (config) => {
        const branch = branches.find((b) => b._id === config.branchId);

        // Get recent errors (last 10)
        const recentErrors = await ctx.db
          .query("posTransactions")
          .withIndex("by_branchId", (q) => q.eq("branchId", config.branchId))
          .filter((q) => q.eq(q.field("syncStatus"), "failed"))
          .order("desc")
          .take(10);

        const totalTransactions = config.syncSuccessCount + config.syncErrorCount;
        const successRate = totalTransactions > 0
          ? (config.syncSuccessCount / totalTransactions) * 100
          : 0;

        return {
          branchId: config.branchId,
          branchName: branch?.name ?? "Unknown",
          isEnabled: config.isEnabled,
          lastSyncAt: config.lastSyncAt,
          syncSuccessCount: config.syncSuccessCount,
          syncErrorCount: config.syncErrorCount,
          successRate: Math.round(successRate * 10) / 10,
          manualOnly: false,
          recentErrors: recentErrors.map((e) => ({
            sku: e.sku,
            error: e.errorMessage ?? "Unknown error",
            timestamp: e.createdAt,
          })),
        };
      })
    );

    // Also list branches without POS config
    const configuredBranchIds = new Set(configs.map((c) => c.branchId));
    const unconfiguredBranches = branches
      .filter((b) => !configuredBranchIds.has(b._id))
      .map((b) => ({
        branchId: b._id,
        branchName: b.name,
        isEnabled: false,
        lastSyncAt: null,
        syncSuccessCount: 0,
        syncErrorCount: 0,
        successRate: 0,
        recentErrors: [],
        manualOnly: true,
      }));

    return [...statuses, ...unconfiguredBranches];
  },
});
