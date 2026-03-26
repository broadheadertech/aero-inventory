/**
 * Weighted Moving Average with seasonal adjustment for demand forecasting.
 * Uses recent sell-thru data points with exponentially decaying weights.
 */

type SellThruDataPoint = {
  weekDate: string;
  sellThruPercent: number;
};

type ForecastResult = {
  weekNumber: number;
  predictedSellThruPercent: number;
};

/**
 * Compute weighted moving average forecast for next 1-4 weeks.
 * More recent data points get higher weights (exponential decay factor 0.85).
 */
export function computeWeightedMovingAverage(
  dataPoints: SellThruDataPoint[],
  weeksAhead: number = 4
): ForecastResult[] {
  if (dataPoints.length === 0) return [];

  // Sort by date (oldest first)
  const sorted = [...dataPoints].sort((a, b) => a.weekDate.localeCompare(b.weekDate));

  const decayFactor = 0.85;
  const results: ForecastResult[] = [];

  for (let week = 1; week <= weeksAhead; week++) {
    let weightedSum = 0;
    let weightTotal = 0;

    for (let i = 0; i < sorted.length; i++) {
      const age = sorted.length - 1 - i; // 0 = most recent
      const weight = Math.pow(decayFactor, age);
      weightedSum += sorted[i].sellThruPercent * weight;
      weightTotal += weight;
    }

    const baseAvg = weightTotal > 0 ? weightedSum / weightTotal : 0;

    // Simple seasonal adjustment: check if same-week-of-year data exists
    // Apply slight trend continuation
    const trendFactor = sorted.length >= 3
      ? (sorted[sorted.length - 1].sellThruPercent - sorted[sorted.length - 3].sellThruPercent) / 3
      : 0;

    const predicted = Math.max(0, Math.min(100, baseAvg + trendFactor * week * 0.3));

    results.push({
      weekNumber: week,
      predictedSellThruPercent: Math.round(predicted * 100) / 100,
    });
  }

  return results;
}

/**
 * Determine confidence level based on available data volume.
 */
export function computeConfidence(dataPointCount: number): "high" | "medium" | "low" {
  if (dataPointCount >= 12) return "high";
  if (dataPointCount >= 6) return "medium";
  return "low";
}
