/**
 * Computes Pearson correlation coefficient between weather data and sell-thru.
 * Used to determine if weather should adjust demand forecasts.
 */

type DataPair = {
  weatherValue: number;
  sellThruPercent: number;
};

/**
 * Pearson correlation: -1 to +1
 * Returns 0 if insufficient data.
 */
export function pearsonCorrelation(pairs: DataPair[]): number {
  if (pairs.length < 5) return 0;

  const n = pairs.length;
  const sumX = pairs.reduce((s, p) => s + p.weatherValue, 0);
  const sumY = pairs.reduce((s, p) => s + p.sellThruPercent, 0);
  const sumXY = pairs.reduce((s, p) => s + p.weatherValue * p.sellThruPercent, 0);
  const sumX2 = pairs.reduce((s, p) => s + p.weatherValue * p.weatherValue, 0);
  const sumY2 = pairs.reduce((s, p) => s + p.sellThruPercent * p.sellThruPercent, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );

  if (denominator === 0) return 0;
  return numerator / denominator;
}

/**
 * Determine if correlation is significant enough to adjust forecasts.
 * |r| >= 0.3 is considered meaningful for weather-sales relationship.
 */
export function isSignificantCorrelation(r: number): boolean {
  return Math.abs(r) >= 0.3;
}

/**
 * Apply weather adjustment to a forecast value.
 * Adjusts based on deviation of forecast weather from historical average,
 * scaled by correlation strength.
 */
export function applyWeatherAdjustment(
  baseForecast: number,
  correlation: number,
  forecastTemp: number,
  avgHistoricalTemp: number
): number {
  if (!isSignificantCorrelation(correlation)) return baseForecast;

  const tempDeviation = forecastTemp - avgHistoricalTemp;
  // Scale adjustment: ±1°C deviation = ±correlation * 0.5% sell-thru adjustment
  const adjustment = tempDeviation * correlation * 0.5;

  return Math.max(0, Math.min(100, baseForecast + adjustment));
}
