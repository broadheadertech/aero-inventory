import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * Run slow mover alert generation every minute.
 * Scans all branchProducts, detects Slow movers, and creates notifications.
 * 1-minute interval satisfies AC4: notifications delivered within 60 seconds.
 */
crons.interval(
  "generate slow mover alerts",
  { minutes: 1 },
  internal.mutations.generateSlowMoverAlerts.generateSlowMoverAlerts
);

/**
 * Evaluate markdown rules daily at 6 AM PHT (22:00 UTC previous day).
 * Generates markdown proposals for qualifying products.
 */
crons.daily(
  "evaluate markdown rules",
  { hourUTC: 22, minuteUTC: 0 },
  internal.mutations.evaluateMarkdownRules.evaluateMarkdownRules
);

/**
 * Refresh weather cache hourly for all active locations.
 */
crons.interval(
  "fetch weather data",
  { hours: 1 },
  internal.mutations.fetchWeatherData.fetchWeatherData
);

/**
 * Run autonomous pipeline daily at 7 AM PHT (23:00 UTC previous day).
 * Evaluates pending proposals against guardrails, auto-executes or flags.
 */
crons.daily(
  "run autonomous pipeline",
  { hourUTC: 23, minuteUTC: 0 },
  internal.mutations.runAutonomousPipeline.runAutonomousPipeline
);

/**
 * Generate autonomous digest daily at 8 AM PHT (00:00 UTC).
 * Summarizes past 24h of autonomous actions for Admin notification.
 */
crons.daily(
  "generate autonomous digest",
  { hourUTC: 0, minuteUTC: 0 },
  internal.mutations.generateAutonomousDigest.generateAutonomousDigest
);

/**
 * ML model training weekly on Sunday 2 AM PHT (18:00 UTC Saturday).
 */
crons.weekly(
  "ml model training",
  { dayOfWeek: "saturday", hourUTC: 18, minuteUTC: 0 },
  internal.mutations.triggerMLTraining.triggerMLTraining
);

/**
 * Evaluate reorder points daily at 6 AM PHT (22:00 UTC previous day).
 * Auto-generates and sends POs when SOH < safety stock.
 */
crons.daily(
  "evaluate reorder points",
  { hourUTC: 22, minuteUTC: 0 },
  internal.mutations.evaluateReorderPoints.evaluateReorderPoints
);

/**
 * Sync loyalty members every 4 hours.
 */
crons.interval(
  "sync loyalty members",
  { hours: 4 },
  internal.mutations.loyaltySync.syncLoyaltyMembers
);

/**
 * Refresh exchange rates daily at 1 AM PHT (17:00 UTC).
 */
crons.daily(
  "refresh exchange rates",
  { hourUTC: 17, minuteUTC: 0 },
  internal.mutations.refreshExchangeRates.refreshExchangeRates
);

/**
 * Compute network/branch/product snapshots every hour.
 * Pre-aggregates sell-thru data so dashboards read O(1) instead of O(branches * products).
 */
crons.interval(
  "compute snapshots",
  { hours: 1 },
  internal.mutations.computeSnapshots.computeSnapshots
);

export default crons;
