import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

export const updateAgingPolicies = mutation({
  args: {
    policies: v.array(
      v.object({
        classification: v.union(
          v.literal("Slow"),
          v.literal("Mid"),
          v.literal("Fast")
        ),
        minWeeks: v.number(),
        maxWeeks: v.optional(v.number()),
        recommendedAction: v.string(),
        priority: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    // Server-side overlap validation per classification
    for (const cls of ["Slow", "Mid", "Fast"] as const) {
      const rules = args.policies
        .filter((p) => p.classification === cls)
        .sort((a, b) => a.minWeeks - b.minWeeks);

      for (let i = 0; i < rules.length - 1; i++) {
        const current = rules[i];
        const next = rules[i + 1];
        const currentMax = current.maxWeeks ?? Infinity;
        if (currentMax >= next.minWeeks) {
          throw new ConvexError(
            `Overlapping week ranges for ${cls}: ${current.minWeeks}–${current.maxWeeks ?? "∞"} overlaps ${next.minWeeks}–${next.maxWeeks ?? "∞"}.`
          );
        }
      }
    }

    const now = new Date().toISOString();

    // Atomic replace: delete all existing, then insert new
    const existing = await ctx.db.query("agingPolicies").collect();
    for (const policy of existing) {
      await ctx.db.delete(policy._id);
    }
    for (const policy of args.policies) {
      await ctx.db.insert("agingPolicies", {
        ...policy,
        updatedAt: now,
      });
    }
  },
});
