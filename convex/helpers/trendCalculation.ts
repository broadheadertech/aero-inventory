import type { Doc } from "../_generated/dataModel";

export type TrendDataPoint = {
  date: string;
  sellThruPercent: number;
  totalSold: number;
  totalBeg: number;
};

/**
 * _computeTrendData — aggregates sales entries into trend data points by time bucket.
 *
 * Groups entries by date bucket (day or week depending on period),
 * computes sell-thru % for each bucket: (totalSold / totalBeg) × 100.
 */
export function _computeTrendData(
  salesEntries: Doc<"salesEntries">[],
  branchProducts: Doc<"branchProducts">[],
  period: string
): TrendDataPoint[] {
  // Determine bucket size
  const useWeekBuckets = period === "3m" || period === "6m";

  // Build branchProduct lookup for BEG values
  const bpMap = new Map<string, number>();
  for (const bp of branchProducts) {
    bpMap.set(bp._id, bp.beginningStock);
  }

  // Group entries by date bucket, track unique branchProducts per bucket for BEG
  const buckets = new Map<string, { sold: number; beg: number; seenBPs: Set<string> }>();

  for (const entry of salesEntries) {
    const entryDate = new Date(entry.enteredAt);
    let bucketKey: string;

    if (useWeekBuckets) {
      // Week bucket: start of week (Monday)
      const d = new Date(entryDate);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      d.setDate(diff);
      bucketKey = d.toISOString().split("T")[0];
    } else {
      bucketKey = entryDate.toISOString().split("T")[0];
    }

    const existing = buckets.get(bucketKey) ?? { sold: 0, beg: 0, seenBPs: new Set<string>() };
    existing.sold += entry.quantitySold;
    // Only count each branchProduct's BEG once per bucket
    if (!existing.seenBPs.has(entry.branchProductId)) {
      existing.seenBPs.add(entry.branchProductId);
      existing.beg += bpMap.get(entry.branchProductId) ?? 0;
    }
    buckets.set(bucketKey, existing);
  }

  // Convert to array sorted by date
  const result: TrendDataPoint[] = [];
  const sortedKeys = Array.from(buckets.keys()).sort();

  for (const date of sortedKeys) {
    const bucket = buckets.get(date)!;
    const sellThruPercent =
      bucket.beg > 0
        ? Math.round(((bucket.sold / bucket.beg) * 100) * 100) / 100
        : 0;
    result.push({
      date,
      sellThruPercent,
      totalSold: bucket.sold,
      totalBeg: bucket.beg,
    });
  }

  return result;
}

export type ComparisonTrendData = {
  productTrend: TrendDataPoint[];
  categoryAvgTrend: TrendDataPoint[];
};

/**
 * _computeCategoryAverage — computes average sell-thru % across multiple product trends.
 * For each date bucket, averages the sell-thru % of all products that have data for that bucket.
 */
export function _computeCategoryAverage(
  productTrends: TrendDataPoint[][]
): TrendDataPoint[] {
  // Collect all unique dates
  const dateBuckets = new Map<string, { totalPercent: number; count: number }>();

  for (const trend of productTrends) {
    for (const point of trend) {
      const existing = dateBuckets.get(point.date) ?? { totalPercent: 0, count: 0 };
      existing.totalPercent += point.sellThruPercent;
      existing.count += 1;
      dateBuckets.set(point.date, existing);
    }
  }

  const result: TrendDataPoint[] = [];
  const sortedDates = Array.from(dateBuckets.keys()).sort();

  for (const date of sortedDates) {
    const bucket = dateBuckets.get(date)!;
    result.push({
      date,
      sellThruPercent: Math.round((bucket.totalPercent / bucket.count) * 100) / 100,
      totalSold: 0,
      totalBeg: 0,
    });
  }

  return result;
}

/**
 * _getDateRangeForPeriod — returns start date ISO string for a given period.
 */
export function _getDateRangeForPeriod(period: string): string {
  const now = new Date();
  switch (period) {
    case "1w":
      now.setDate(now.getDate() - 7);
      break;
    case "1m":
      now.setMonth(now.getMonth() - 1);
      break;
    case "3m":
      now.setMonth(now.getMonth() - 3);
      break;
    case "6m":
      now.setMonth(now.getMonth() - 6);
      break;
    default:
      now.setMonth(now.getMonth() - 1);
  }
  return now.toISOString();
}
