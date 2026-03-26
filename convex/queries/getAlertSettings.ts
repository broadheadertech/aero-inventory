import { query } from "../_generated/server";
import { _requireAuth } from "../helpers/auth";

export const getAlertSettings = query({
  args: {},
  handler: async (ctx) => {
    await _requireAuth(ctx);
    return await ctx.db.query("alertSettings").first();
  },
});
