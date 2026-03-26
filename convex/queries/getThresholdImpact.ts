import { query } from "../_generated/server";
import { v } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";
import { _calculateSellThru, _classify } from "../helpers/sellThru";

// Fallback values matching FALLBACK_THRESHOLDS in convex/helpers/sellThru.ts
const FALLBACK: Record<string, { fast: number; slow: number }> = {
  daily: { fast: 1, slow: 0.2 },
  weekly: { fast: 5, slow: 1 },
  monthly: { fast: 20, slow: 5 },
  quarterly: { fast: 60, slow: 15 },
};

const PERIODS = ["daily", "weekly", "monthly", "quarterly"] as const;

export const getThresholdImpact = query({
  args: {
    pendingThresholds: v.object({
      daily: v.object({ fast: v.number(), slow: v.number() }),
      weekly: v.object({ fast: v.number(), slow: v.number() }),
      monthly: v.object({ fast: v.number(), slow: v.number() }),
      quarterly: v.object({ fast: v.number(), slow: v.number() }),
    }),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    // Load saved thresholds
    const savedRows = await ctx.db
      .query("settings")
      .withIndex("by_settingKey", (q) =>
        q.eq("settingKey", "sell_thru_thresholds")
      )
      .collect();
    const saved: Record<string, { fast: number; slow: number }> = {
      ...FALLBACK,
    };
    for (const row of savedRows) {
      saved[row.timePeriod] = {
        fast: row.fastThreshold,
        slow: row.slowThreshold,
      };
    }

    // Batch-load all data — avoids N+1 per branchProduct
    const allBranchProducts = await ctx.db.query("branchProducts").collect();
    const allProducts = await ctx.db.query("products").collect();
    const allBranches = await ctx.db.query("branches").collect();

    const productMap = new Map(
      allProducts.map((p) => [p._id as string, p])
    );
    const branchMap = new Map(
      allBranches.map((b) => [b._id as string, b])
    );

    const impactRows: {
      styleCode: string;
      productName: string;
      branchName: string;
      period: string;
      currentClassification: "Fast" | "Mid" | "Slow";
      newClassification: "Fast" | "Mid" | "Slow";
    }[] = [];
    const affectedBranches = new Set<string>();

    for (const bp of allBranchProducts) {
      const calc = _calculateSellThru(bp.beginningStock, bp.currentSOH);
      if (!calc) continue;

      const product = productMap.get(bp.productId as string);
      const branch = branchMap.get(bp.branchId as string);
      if (!product || !branch) continue;

      for (const period of PERIODS) {
        const sv = saved[period];
        const pv = args.pendingThresholds[period];
        const cur = _classify(calc.sellThruPercent, sv.fast, sv.slow);
        const nxt = _classify(calc.sellThruPercent, pv.fast, pv.slow);
        if (cur !== nxt) {
          impactRows.push({
            styleCode: product.styleCode,
            productName: product.name,
            branchName: branch.name,
            period,
            currentClassification: cur,
            newClassification: nxt,
          });
          affectedBranches.add(bp.branchId as string);
        }
      }
    }

    return {
      totalAffected: impactRows.length,
      branchCount: affectedBranches.size,
      rows: impactRows,
    };
  },
});
