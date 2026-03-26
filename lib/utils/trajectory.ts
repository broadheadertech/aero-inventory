export type TrajectoryDirection = "fast" | "mid" | "slow" | "stable";

/**
 * Compute trajectory from delta between two sell-thru % values.
 * Shared between server (Convex queries) and client (UI components).
 */
export function computeTrajectoryFromDelta(
  delta: number,
  currentSellThru: number
): TrajectoryDirection {
  if (delta > 1) return "fast";
  if (delta < -1) return "slow";
  if (Math.abs(delta) <= 1 && currentSellThru > 3) return "mid";
  return "stable";
}
