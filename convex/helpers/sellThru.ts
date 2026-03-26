import type { QueryCtx } from "../_generated/server";

const FALLBACK_THRESHOLDS: Record<string, { fastThreshold: number; slowThreshold: number }> = {
  daily:     { fastThreshold: 1,   slowThreshold: 0.2 },
  weekly:    { fastThreshold: 5,   slowThreshold: 1   },
  monthly:   { fastThreshold: 20,  slowThreshold: 5   },
  quarterly: { fastThreshold: 60,  slowThreshold: 15  },
};

export function _calculateSellThru(
  beginningStock: number,
  currentSOH: number
): { sold: number; sellThruPercent: number } | null {
  if (beginningStock === 0) return null;
  const sold = Math.max(0, beginningStock - currentSOH); // clamp negative (data integrity)
  const sellThruPercent = Math.round((sold / beginningStock) * 1000) / 10; // 1 decimal
  return { sold, sellThruPercent };
}

export function _classify(
  sellThruPercent: number,
  fastThreshold: number,
  slowThreshold: number
): "Fast" | "Mid" | "Slow" {
  if (sellThruPercent >= fastThreshold) return "Fast";
  if (sellThruPercent <= slowThreshold) return "Slow";
  return "Mid";
}

export function _calculateADS(
  sold: number,
  deliveryInStoreDate: string | null
): number | null {
  if (!deliveryInStoreDate) return null;
  const daysOnFloor = Math.floor(
    (Date.now() - new Date(deliveryInStoreDate).getTime()) / 86_400_000
  );
  if (isNaN(daysOnFloor) || daysOnFloor <= 0) return null;
  return Math.round((sold / daysOnFloor) * 10) / 10;
}

export function _calculateDSI(
  currentSOH: number,
  ads: number | null
): number | null {
  if (ads === null || ads === 0) return null;
  if (currentSOH === 0) return 0;
  return Math.round((currentSOH / ads) * 10) / 10;
}

export function _calculateMI(
  sellThruPercent: number | null,
  categoryAvgSellThru: number | null
): number | null {
  if (sellThruPercent === null || categoryAvgSellThru === null || categoryAvgSellThru === 0) return null;
  const mi = (sellThruPercent / categoryAvgSellThru) * 100;
  return Math.round(mi * 10) / 10;
}

export function _calculateCategoryAverages(
  rows: Array<{ category: string; sellThruPercent: number | null }>
): Map<string, number> {
  const sums = new Map<string, { total: number; count: number }>();
  for (const row of rows) {
    if (row.sellThruPercent === null) continue;
    const entry = sums.get(row.category) ?? { total: 0, count: 0 };
    entry.total += row.sellThruPercent;
    entry.count++;
    sums.set(row.category, entry);
  }
  const averages = new Map<string, number>();
  for (const [cat, { total, count }] of sums) {
    averages.set(cat, total / count);
  }
  return averages;
}

export function _applyAgingRemark(
  policies: Array<{
    classification: "Slow" | "Mid" | "Fast";
    minWeeks: number;
    maxWeeks?: number;
    recommendedAction: string;
    priority: number;
  }>,
  classification: "Fast" | "Mid" | "Slow" | "N/A",
  weeksOnFloor: number | null
): string {
  if (classification === "N/A" || weeksOnFloor === null) return "—";
  const matches = policies.filter(
    (p) =>
      p.classification === classification &&
      weeksOnFloor >= p.minWeeks &&
      (p.maxWeeks === undefined || weeksOnFloor <= p.maxWeeks)
  );
  if (matches.length === 0) return "—";
  matches.sort((a, b) => a.priority - b.priority);
  return matches[0].recommendedAction || "—";
}

export async function _getThresholds(
  ctx: QueryCtx,
  timePeriod: string
): Promise<{ fastThreshold: number; slowThreshold: number }> {
  const row = await ctx.db
    .query("settings")
    .withIndex("by_timePeriod", (q) => q.eq("timePeriod", timePeriod))
    .filter((q) => q.eq(q.field("settingKey"), "sell_thru_thresholds"))
    .first();
  if (row) return { fastThreshold: row.fastThreshold as number, slowThreshold: row.slowThreshold as number };
  return FALLBACK_THRESHOLDS[timePeriod] ?? FALLBACK_THRESHOLDS.weekly;
}
