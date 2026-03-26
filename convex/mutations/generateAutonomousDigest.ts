import { internalMutation } from "../_generated/server";

/**
 * Daily digest: compiles autonomous actions from the past 24 hours
 * into a summary notification for Admin.
 * Runs at 8 AM PHT (00:00 UTC).
 */
export const generateAutonomousDigest = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const recentActions = await ctx.db
      .query("autonomousActions")
      .withIndex("by_executedAt")
      .filter((q) => q.gte(q.field("executedAt"), twentyFourHoursAgo))
      .collect();

    if (recentActions.length === 0) return { generated: false, reason: "No actions in past 24h" };

    // Aggregate counts
    const counts = {
      autoExecuted: recentActions.filter((a) => a.status === "auto-executed").length,
      flagged: recentActions.filter((a) => a.status === "flagged").length,
      approved: recentActions.filter((a) => a.status === "approved").length,
      rejected: recentActions.filter((a) => a.status === "rejected").length,
      undone: recentActions.filter((a) => a.status === "undone").length,
    };

    const byType = {
      markdown: recentActions.filter((a) => a.actionType === "markdown").length,
      replenishment: recentActions.filter((a) => a.actionType === "replenishment").length,
      allocation: recentActions.filter((a) => a.actionType === "allocation").length,
    };

    const digestSummary = [
      `Autonomous Digest - ${now.toISOString().split("T")[0]}`,
      `Total actions: ${recentActions.length}`,
      `Auto-executed: ${counts.autoExecuted} | Flagged: ${counts.flagged} | Approved: ${counts.approved} | Rejected: ${counts.rejected}${counts.undone > 0 ? ` | Undone: ${counts.undone}` : ""}`,
      `By type: Markdown ${byType.markdown} | Replenishment ${byType.replenishment} | Allocation ${byType.allocation}`,
    ].join("\n");

    // Create notification for all admin users
    const adminUsers = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .collect();

    for (const admin of adminUsers) {
      await ctx.db.insert("notifications", {
        userId: admin._id,
        type: "autonomous_digest",
        title: `Autonomous Digest: ${recentActions.length} actions`,
        message: digestSummary,
        isRead: false,
        createdAt: now.toISOString(),
      });
    }

    return { generated: true, actionCount: recentActions.length, counts };
  },
});
