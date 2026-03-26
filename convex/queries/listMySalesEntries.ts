import { query } from "../_generated/server";
import { v } from "convex/values";
import { _requireAuth } from "../helpers/auth";
import type { Doc } from "../_generated/dataModel";

export const listMySalesEntries = query({
  args: {
    date: v.optional(v.string()), // ISO 8601 date prefix, e.g. "2026-03-11" — defaults to today if omitted
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);

    // If no branch assigned, show all entries for the user (handles Admin-as-Staff)
    const hasBranch = auth.branchIds.length > 0;

    let entries;

    if (hasBranch) {
      // Query by branch + optional date filter
      if (args.date) {
        const startOfDay = `${args.date}T00:00:00.000Z`;
        const endOfDay = `${args.date}T23:59:59.999Z`;
        entries = await ctx.db
          .query("salesEntries")
          .withIndex("by_branchId_enteredAt", (q) => q.eq("branchId", auth.branchIds[0]))
          .filter((q) =>
            q.and(
              q.gte(q.field("enteredAt"), startOfDay),
              q.lte(q.field("enteredAt"), endOfDay)
            )
          )
          .order("desc")
          .collect();
      } else {
        // No date filter — show last 50 entries for the branch
        entries = await ctx.db
          .query("salesEntries")
          .withIndex("by_branchId_enteredAt", (q) => q.eq("branchId", auth.branchIds[0]))
          .order("desc")
          .take(50);
      }
    } else {
      // No branch assigned (e.g. Admin testing) — show last 50 entries across all
      entries = await ctx.db
        .query("salesEntries")
        .order("desc")
        .take(50);
    }

    // Branch Staff: filter to own entries only. Branch Manager + Admin: all branch entries.
    const filtered =
      auth.role === "Branch Staff"
        ? entries.filter((e) => e.enteredBy === auth.userId)
        : entries;

    // Enrich with product info and entered-by user name
    return Promise.all(
      filtered.map(async (entry) => {
        const product = (await ctx.db.get(entry.productId)) as Doc<"products"> | null;
        const enteredByUser = (await ctx.db.get(entry.enteredBy)) as Doc<"users"> | null;
        return {
          ...entry,
          product,
          enteredByName: enteredByUser?.name ?? "Unknown",
        };
      })
    );
  },
});
