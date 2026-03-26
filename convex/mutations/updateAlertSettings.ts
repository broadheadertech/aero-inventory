import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

export const updateAlertSettings = mutation({
  args: {
    minWeeksOnFloor: v.number(),
    minBranchesForNetworkAlert: v.number(),
    alertFrequency: v.union(v.literal("once"), v.literal("weekly")),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    if (!Number.isInteger(args.minWeeksOnFloor) || args.minWeeksOnFloor < 1) {
      throw new ConvexError(
        "Minimum weeks on floor must be a positive whole number."
      );
    }
    if (
      !Number.isInteger(args.minBranchesForNetworkAlert) ||
      args.minBranchesForNetworkAlert < 1
    ) {
      throw new ConvexError(
        "Minimum branches for network alert must be a positive whole number."
      );
    }

    const now = new Date().toISOString();
    const existing = await ctx.db.query("alertSettings").first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        minWeeksOnFloor: args.minWeeksOnFloor,
        minBranchesForNetworkAlert: args.minBranchesForNetworkAlert,
        alertFrequency: args.alertFrequency,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("alertSettings", {
        minWeeksOnFloor: args.minWeeksOnFloor,
        minBranchesForNetworkAlert: args.minBranchesForNetworkAlert,
        alertFrequency: args.alertFrequency,
        updatedAt: now,
      });
    }
  },
});
