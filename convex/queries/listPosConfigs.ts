import { query } from "../_generated/server";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

export const listPosConfigs = query({
  args: {},
  handler: async (ctx) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const configs = await ctx.db.query("posConfig").collect();

    const enriched = await Promise.all(
      configs.map(async (config) => {
        const branch = await ctx.db.get(config.branchId);
        return {
          ...config,
          branchName: branch?.name ?? "Unknown Branch",
        };
      })
    );

    return enriched;
  },
});
