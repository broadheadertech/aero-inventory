import { query } from "../_generated/server";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

export const listMLModels = query({
  args: {},
  handler: async (ctx) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    return await ctx.db
      .query("mlModels")
      .withIndex("by_trainedAt")
      .order("desc")
      .take(20);
  },
});
