import { query } from "../_generated/server";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

export const listRegions = query({
  args: {},
  handler: async (ctx) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);
    return await ctx.db.query("regions").collect();
  },
});

export const listExchangeRates = query({
  args: {},
  handler: async (ctx) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);
    return await ctx.db.query("exchangeRates").collect();
  },
});
