import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

export const createRegion = mutation({
  args: {
    name: v.string(),
    countryCode: v.string(),
    currencyCode: v.string(),
    timezone: v.string(),
    locale: v.string(),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);
    return await ctx.db.insert("regions", { ...args, isActive: true, createdAt: new Date().toISOString() });
  },
});

export const updateRegion = mutation({
  args: {
    regionId: v.id("regions"),
    name: v.string(),
    currencyCode: v.string(),
    timezone: v.string(),
    locale: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);
    const { regionId, ...fields } = args;
    await ctx.db.patch(regionId, fields);
  },
});

export const deleteRegion = mutation({
  args: { regionId: v.id("regions") },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    // M2 fix: check for assigned branches before deleting
    const branches = await ctx.db.query("branches").collect();
    const assigned = branches.filter((b: Record<string, unknown>) => b.regionId === args.regionId);
    if (assigned.length > 0) {
      throw new ConvexError(`Cannot delete region — ${assigned.length} branch(es) assigned to it.`);
    }

    await ctx.db.delete(args.regionId);
  },
});
