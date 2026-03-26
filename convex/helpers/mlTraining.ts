/**
 * ML Training helper — simulates model training for demo purposes.
 * In production, this would call an external ML service (SageMaker, Vertex AI, etc.)
 */

import type { MutationCtx } from "../_generated/server";

const FEATURE_SET = ["sell_thru_history", "seasonality", "weather", "feedback_sentiment", "category_trends"];

/**
 * Extract training features from historical data.
 * Returns feature summary for model metadata.
 */
export async function extractTrainingFeatures(ctx: MutationCtx) {
  // L1: Use bounded takes to estimate counts without full table scans
  // In production, these counts would come from the ML service's data export step
  const salesSample = await ctx.db.query("salesEntries").take(1001);
  const weatherSample = await ctx.db.query("weatherCache").take(101);
  const feedbackSample = await ctx.db.query("customerFeedback").take(51);
  const productSample = await ctx.db.query("products").take(101);

  const salesCount = salesSample.length;
  const weatherCount = weatherSample.length;
  const feedbackCount = feedbackSample.length;
  const productCount = productSample.length;

  return {
    featureSet: FEATURE_SET,
    dataPoints: {
      salesEntries: salesCount,
      weatherData: weatherCount,
      feedbackEntries: feedbackCount,
      products: productCount,
    },
  };
}

/**
 * Simulate ML model training.
 * Computes a mock accuracy score based on data volume.
 * In production, this would be replaced with actual ML training call.
 */
export function simulateTraining(dataPoints: {
  salesEntries: number;
  weatherData: number;
  feedbackEntries: number;
  products: number;
}): { accuracy: number; confidence: number } {
  // More data = higher accuracy (simulated)
  const dataScore = Math.min(1, (
    (dataPoints.salesEntries / 1000) * 0.4 +
    (dataPoints.weatherData / 100) * 0.2 +
    (dataPoints.feedbackEntries / 50) * 0.1 +
    (dataPoints.products / 100) * 0.3
  ));

  // Base accuracy 60% + up to 30% from data quality
  const accuracy = 60 + dataScore * 30;
  const confidence = Math.min(0.95, 0.5 + dataScore * 0.45);

  return {
    accuracy: Math.round(accuracy * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
  };
}

/**
 * Generate a semantic version for a new model.
 */
export function generateModelVersion(existingCount: number): string {
  const major = 1;
  const minor = Math.floor(existingCount / 10);
  const patch = existingCount % 10;
  return `${major}.${minor}.${patch}`;
}
