import { mutation, internalMutation } from "../_generated/server";
import type { MutationCtx } from "../_generated/server";
import { _requireAuth, _assertAdmin } from "../helpers/auth";
import { extractTrainingFeatures, simulateTraining, generateModelVersion } from "../helpers/mlTraining";

/**
 * Admin-triggered manual ML model training.
 */
export const triggerMLTrainingManual = mutation({
  args: {},
  handler: async (ctx) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    return await runTraining(ctx);
  },
});

/**
 * Cron-triggered automatic ML model training.
 */
export const triggerMLTraining = internalMutation({
  args: {},
  handler: async (ctx) => {
    return await runTraining(ctx);
  },
});

async function runTraining(ctx: MutationCtx) {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const trainingDataRange = `${sixMonthsAgo.toISOString().split("T")[0]} to ${now.toISOString().split("T")[0]}`;

  // Get latest model for versioning (avoid full table scan)
  const latestModel = await ctx.db.query("mlModels").withIndex("by_trainedAt").order("desc").first();
  const existingCount = latestModel ? parseInt(latestModel.modelVersion.split(".").pop() ?? "0", 10) + 1 + parseInt(latestModel.modelVersion.split(".")[1] ?? "0", 10) * 10 : 0;
  const modelVersion = generateModelVersion(existingCount);

  // Create model record in "training" status
  const modelId = await ctx.db.insert("mlModels", {
    modelVersion,
    status: "training",
    trainingDataRange,
    featureSet: [],
    createdAt: now.toISOString(),
  });

  // Extract features
  const features = await extractTrainingFeatures(ctx);

  // Simulate training (in production: call external ML service)
  const result = simulateTraining(features.dataPoints);

  // Update model with results
  await ctx.db.patch(modelId, {
    status: "ready",
    accuracy: result.accuracy,
    featureSet: features.featureSet,
    trainedAt: now.toISOString(),
  });

  return {
    modelId,
    modelVersion,
    accuracy: result.accuracy,
    dataPoints: features.dataPoints,
  };
}
