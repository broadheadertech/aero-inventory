import { internalMutation } from "../_generated/server";

/**
 * Hourly cron: fetch weather data from OpenWeatherMap for all active locations.
 * Caches results in weatherCache with 1-hour TTL.
 * Graceful degradation: if API fails, existing cache is retained.
 */
export const fetchWeatherData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const locations = await ctx.db
      .query("weatherLocations")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    if (locations.length === 0) return { fetched: 0 };

    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    if (!apiKey) {
      console.warn("OPENWEATHERMAP_API_KEY not set — skipping weather fetch");
      return { fetched: 0, error: "API key not configured" };
    }

    const now = new Date();
    const today = now.toISOString().split("T")[0];
    let fetched = 0;

    for (const location of locations) {
      // Check if we already have a recent cache entry (within 1 hour)
      const existing = await ctx.db
        .query("weatherCache")
        .withIndex("by_locationId_date", (q) =>
          q.eq("locationId", location._id).eq("date", today)
        )
        .first();

      if (existing) {
        const fetchedAt = new Date(existing.fetchedAt);
        const ageMs = now.getTime() - fetchedAt.getTime();
        if (ageMs < 60 * 60 * 1000) continue; // Skip if less than 1 hour old
      }

      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${location.latitude}&lon=${location.longitude}&appid=${apiKey}&units=metric`;
        const response = await fetch(url);

        if (!response.ok) {
          console.warn(`Weather API error for ${location.name}: ${response.status}`);
          continue;
        }

        const data = await response.json();

        if (existing) {
          await ctx.db.patch(existing._id, {
            temperatureCelsius: data.main?.temp ?? 0,
            humidity: data.main?.humidity ?? 0,
            rainfallMm: data.rain?.["1h"] ?? 0,
            weatherCondition: data.weather?.[0]?.main ?? "Unknown",
            fetchedAt: now.toISOString(),
          });
        } else {
          await ctx.db.insert("weatherCache", {
            locationId: location._id,
            date: today,
            temperatureCelsius: data.main?.temp ?? 0,
            humidity: data.main?.humidity ?? 0,
            rainfallMm: data.rain?.["1h"] ?? 0,
            weatherCondition: data.weather?.[0]?.main ?? "Unknown",
            fetchedAt: now.toISOString(),
          });
        }

        fetched++;
      } catch (error) {
        // Graceful degradation: log and continue
        console.warn(`Failed to fetch weather for ${location.name}:`, error);
      }
    }

    return { fetched };
  },
});
