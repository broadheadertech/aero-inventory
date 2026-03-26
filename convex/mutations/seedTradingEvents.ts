import { mutation } from "../_generated/server";
import { ConvexError } from "convex/values";

/**
 * seedTradingEvents — seeds default PH trading events for 2026.
 * Includes paydays (15th + 30th), holidays, back-to-school, Christmas season.
 */
export const seedTradingEvents = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    // Check if events exist
    const existing = await ctx.db.query("tradingEvents").first();
    if (existing) {
      // Delete all and re-seed
      const all = await ctx.db.query("tradingEvents").collect();
      for (const e of all) await ctx.db.delete(e._id);
    }

    const now = new Date().toISOString();
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    const userId = user?._id;

    const events: Array<{
      name: string;
      eventType: string;
      startDate: string;
      endDate: string;
      description: string;
      actions: Array<{ actionType: string; actionDetails: string }>;
      reminderDaysBefore?: number;
    }> = [];

    // Paydays — 15th and 30th of each month (2026)
    for (let month = 0; month < 12; month++) {
      const monthName = new Date(2026, month, 1).toLocaleString("en", { month: "short" });

      // 15th payday
      events.push({
        name: `${monthName} 15 Payday`,
        eventType: "promotion",
        startDate: `2026-${String(month + 1).padStart(2, "0")}-15`,
        endDate: `2026-${String(month + 1).padStart(2, "0")}-17`,
        description: "Mid-month payday — expect higher foot traffic",
        actions: [],
      });

      // 30th payday (or 28th for Feb)
      const lastPayday = month === 1 ? 28 : 30;
      events.push({
        name: `${monthName} ${lastPayday} Payday`,
        eventType: "promotion",
        startDate: `2026-${String(month + 1).padStart(2, "0")}-${lastPayday}`,
        endDate: `2026-${String(month + 1).padStart(2, "0")}-${Math.min(lastPayday + 2, month === 1 ? 28 : 30)}`,
        description: "End-of-month payday — expect higher foot traffic",
        actions: [],
      });
    }

    // PH Holidays & Key Retail Dates 2026
    const holidays = [
      { name: "New Year Sale", start: "2026-01-01", end: "2026-01-04", type: "sale", desc: "Post-New Year clearance sale", reminder: 7 },
      { name: "Valentine's Day", start: "2026-02-13", end: "2026-02-14", type: "promotion", desc: "Valentine's Day promo — couples and gift items", reminder: 14 },
      { name: "Summer Collection Launch", start: "2026-03-15", end: "2026-03-22", type: "collection_launch", desc: "Summer 2026 collection arrives in stores", reminder: 21 },
      { name: "Holy Week", start: "2026-03-30", end: "2026-04-05", type: "markdown", desc: "Pre-Holy Week markdown on winter/transition items", reminder: 14 },
      { name: "Summer Sale", start: "2026-04-15", end: "2026-05-03", type: "sale", desc: "Summer sale event — mall-wide promos", reminder: 14 },
      { name: "Mother's Day", start: "2026-05-10", end: "2026-05-10", type: "promotion", desc: "Mother's Day promo — women's collection focus", reminder: 7 },
      { name: "Independence Day", start: "2026-06-12", end: "2026-06-14", type: "promotion", desc: "PH Independence Day long weekend sale", reminder: 7 },
      { name: "Back to School", start: "2026-07-15", end: "2026-08-01", type: "promotion", desc: "Back-to-school season — casual wear and basics focus", reminder: 21 },
      { name: "Fall Collection Launch", start: "2026-08-15", end: "2026-08-22", type: "collection_launch", desc: "Fall 2026 collection rollout", reminder: 21 },
      { name: "Mid-Year Clearance", start: "2026-06-25", end: "2026-07-10", type: "markdown", desc: "Mid-year clearance — markdown Spring/Summer slow movers", reminder: 14 },
      { name: "National Heroes Day", start: "2026-08-31", end: "2026-08-31", type: "promotion", desc: "Long weekend promo", reminder: 3 },
      { name: "Ber Months Kickoff", start: "2026-09-01", end: "2026-09-07", type: "promotion", desc: "Christmas shopping starts — Ber months marketing push", reminder: 7 },
      { name: "11.11 Sale", start: "2026-11-11", end: "2026-11-13", type: "sale", desc: "11.11 mega sale — compete with online promos", reminder: 14 },
      { name: "Christmas Collection Launch", start: "2026-10-15", end: "2026-10-22", type: "collection_launch", desc: "Holiday/Christmas collection arrives", reminder: 21 },
      { name: "Black Friday", start: "2026-11-27", end: "2026-11-29", type: "sale", desc: "Black Friday weekend sale", reminder: 14 },
      { name: "Christmas Season", start: "2026-12-01", end: "2026-12-25", type: "sale", desc: "Christmas season — peak retail period, extended store hours", reminder: 30 },
      { name: "Year-End Clearance", start: "2026-12-26", end: "2026-12-31", type: "markdown", desc: "Post-Christmas clearance — aggressive markdowns on remaining stock", reminder: 7 },
    ];

    for (const h of holidays) {
      events.push({
        name: h.name,
        eventType: h.type,
        startDate: h.start,
        endDate: h.end,
        description: h.desc,
        actions: [],
        reminderDaysBefore: h.reminder,
      });
    }

    // Insert all events
    let count = 0;
    for (const e of events) {
      // Map "sale" to "promotion" since schema only allows collection_launch/markdown/promotion
      const eventType = e.eventType === "sale" ? "promotion" : e.eventType;
      await ctx.db.insert("tradingEvents", {
        name: e.name,
        eventType: eventType as "collection_launch" | "markdown" | "promotion",
        startDate: e.startDate,
        endDate: e.endDate,
        description: e.description,
        actions: [],
        reminderDaysBefore: e.reminderDaysBefore,
        linkedBranchIds: [],
        createdByUserId: userId!,
        createdAt: now,
        updatedAt: now,
      });
      count++;
    }

    return { seeded: true, eventsCreated: count };
  },
});
