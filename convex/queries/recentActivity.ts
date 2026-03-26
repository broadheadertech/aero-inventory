import { query } from "../_generated/server";
import { _requireAuth } from "../helpers/auth";

export const recentActivity = query({
  args: {},
  handler: async (ctx) => {
    await _requireAuth(ctx);

    const auditLogs = await ctx.db
      .query("auditLogs")
      .order("desc")
      .take(10);

    const enriched = await Promise.all(
      auditLogs.map(async (log) => {
        const actor = await ctx.db.get(log.actor);
        return {
          ...log,
          actorName: actor?.name ?? "System",
        };
      })
    );

    return enriched;
  },
});
