import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

export const createWeatherLocation = mutation({
  args: {
    name: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    branchIds: v.array(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);
    return await ctx.db.insert("weatherLocations", {
      ...args,
      isActive: true,
      createdAt: new Date().toISOString(),
    });
  },
});

export const updateWeatherLocation = mutation({
  args: {
    locationId: v.id("weatherLocations"),
    name: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    branchIds: v.array(v.id("branches")),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);
    const existing = await ctx.db.get(args.locationId);
    if (!existing) throw new ConvexError("Location not found.");
    const { locationId, ...fields } = args;
    await ctx.db.patch(locationId, fields);
  },
});

export const deleteWeatherLocation = mutation({
  args: { locationId: v.id("weatherLocations") },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);
    await ctx.db.delete(args.locationId);
  },
});
