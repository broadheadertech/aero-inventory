import { mutation } from "../_generated/server";
import { _requireAuth, _assertAdmin } from "../helpers/auth";
import { internal } from "../_generated/api";

/**
 * triggerSnapshotCompute — allows Admin to manually refresh snapshots.
 * Schedules the internal computeSnapshots mutation.
 */
export const triggerSnapshotCompute = mutation({
  args: {},
  handler: async (ctx) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    await ctx.scheduler.runAfter(0, internal.mutations.computeSnapshots.computeSnapshots, {});

    return { scheduled: true };
  },
});
