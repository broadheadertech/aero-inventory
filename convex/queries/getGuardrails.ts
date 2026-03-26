import { query } from "../_generated/server";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

export const getGuardrails = query({
  args: {},
  handler: async (ctx) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const guardrails = await ctx.db.query("autonomousGuardrails").collect();

    // Ensure all 3 action types exist (return defaults for missing)
    const actionTypes = ["markdown", "replenishment", "allocation"];
    const result = actionTypes.map((type) => {
      const existing = guardrails.find((g) => g.actionType === type);
      if (existing) return existing;
      return {
        _id: undefined as unknown as typeof existing extends { _id: infer T } ? T : never,
        actionType: type,
        isEnabled: false,
        maxMarkdownPercent: type === "markdown" ? 20 : undefined,
        maxAllocationQty: type === "allocation" ? 50 : undefined,
        maxReplenishmentQty: type === "replenishment" ? 100 : undefined,
        forecastVarianceTolerance: 15,
        updatedAt: "",
        isDefault: true,
      };
    });

    const globalEnabled = result.every((g) => g.isEnabled);

    return { guardrails: result, globalEnabled };
  },
});
