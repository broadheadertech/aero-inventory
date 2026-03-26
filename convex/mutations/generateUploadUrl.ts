import { mutation } from "../_generated/server";
import { _requireAuth } from "../helpers/auth";

/**
 * Generate a Convex upload URL for file storage.
 * Used for product image uploads.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await _requireAuth(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});
