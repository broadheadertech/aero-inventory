import { internalMutation } from "../_generated/server";

/**
 * Daily exchange rate refresh (simulated).
 * In production, would fetch from exchangerate-api.com or Open Exchange Rates.
 */
export const refreshExchangeRates = internalMutation({
  args: {},
  handler: async (ctx) => {
    const regions = await ctx.db.query("regions").withIndex("by_isActive", (q) => q.eq("isActive", true)).collect();
    const now = new Date().toISOString();
    const baseCurrency = "PHP";
    let updated = 0;

    // Simulated exchange rates
    const simulatedRates: Record<string, number> = {
      PHP: 1,
      VND: 445, // 1 PHP ≈ 445 VND
      IDR: 280, // 1 PHP ≈ 280 IDR
      USD: 0.018, // 1 PHP ≈ 0.018 USD
      THB: 0.63, // 1 PHP ≈ 0.63 THB
    };

    for (const region of regions) {
      if (region.currencyCode === baseCurrency) continue;

      const rate = simulatedRates[region.currencyCode] ?? 1;

      // Upsert exchange rate
      const existing = await ctx.db
        .query("exchangeRates")
        .withIndex("by_fromCurrency", (q) => q.eq("fromCurrency", baseCurrency))
        .filter((q) => q.eq(q.field("toCurrency"), region.currencyCode))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, { rate, fetchedAt: now });
      } else {
        await ctx.db.insert("exchangeRates", {
          fromCurrency: baseCurrency,
          toCurrency: region.currencyCode,
          rate,
          fetchedAt: now,
        });
      }

      // Also store reverse rate
      const reverseExisting = await ctx.db
        .query("exchangeRates")
        .withIndex("by_fromCurrency", (q) => q.eq("fromCurrency", region.currencyCode))
        .filter((q) => q.eq(q.field("toCurrency"), baseCurrency))
        .first();

      if (reverseExisting) {
        await ctx.db.patch(reverseExisting._id, { rate: 1 / rate, fetchedAt: now });
      } else {
        await ctx.db.insert("exchangeRates", {
          fromCurrency: region.currencyCode,
          toCurrency: baseCurrency,
          rate: 1 / rate,
          fetchedAt: now,
        });
      }

      updated++;
    }

    return { updated };
  },
});
