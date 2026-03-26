/**
 * Keyword-based sentiment scoring and theme extraction for customer feedback.
 */

const POSITIVE_KEYWORDS = [
  "love", "great", "perfect", "excellent", "amazing", "wonderful", "fantastic",
  "beautiful", "comfortable", "soft", "fits", "recommend", "happy", "best",
  "quality", "worth", "impressed", "stylish", "cute", "nice",
];

const NEGATIVE_KEYWORDS = [
  "terrible", "awful", "broken", "disappointed", "poor", "worst", "hate",
  "cheap", "flimsy", "uncomfortable", "tight", "small", "large", "faded",
  "ripped", "stain", "defect", "return", "refund", "waste",
];

/**
 * Score sentiment based on keyword presence.
 * Returns "positive", "neutral", or "negative".
 */
export function scoreSentiment(comment: string): "positive" | "neutral" | "negative" {
  const lower = comment.toLowerCase();
  const words = lower.split(/\W+/);

  let positiveCount = 0;
  let negativeCount = 0;

  for (const word of words) {
    if (POSITIVE_KEYWORDS.includes(word)) positiveCount++;
    if (NEGATIVE_KEYWORDS.includes(word)) negativeCount++;
  }

  if (positiveCount > negativeCount) return "positive";
  if (negativeCount > positiveCount) return "negative";
  return "neutral";
}

/**
 * Extract themes from comment based on configurable keyword mappings.
 */
export function extractThemes(
  comment: string,
  themeConfigs: Array<{ theme: string; keywords: string[]; isActive: boolean }>
): string[] {
  const lower = comment.toLowerCase();
  const themes: string[] = [];

  for (const config of themeConfigs) {
    if (!config.isActive) continue;
    const matched = config.keywords.some((keyword) => lower.includes(keyword.toLowerCase()));
    if (matched) themes.push(config.theme);
  }

  return themes;
}

/**
 * Default theme configurations for initial seeding.
 */
export const DEFAULT_THEMES = [
  { theme: "sizing", keywords: ["size", "sizing", "fit", "fits", "tight", "loose", "small", "large", "runs small", "runs large", "too big", "too small"], isActive: true },
  { theme: "quality", keywords: ["quality", "material", "fabric", "stitching", "durable", "flimsy", "cheap", "premium", "well-made", "poorly made", "ripped", "faded"], isActive: true },
  { theme: "design", keywords: ["design", "style", "color", "pattern", "print", "look", "appearance", "trendy", "cute", "ugly", "plain"], isActive: true },
  { theme: "price", keywords: ["price", "expensive", "cheap", "value", "worth", "overpriced", "affordable", "cost", "deal", "discount"], isActive: true },
  { theme: "availability", keywords: ["stock", "available", "sold out", "out of stock", "restock", "inventory", "supply"], isActive: true },
  { theme: "service", keywords: ["service", "staff", "help", "rude", "friendly", "assistance", "store", "experience", "cashier"], isActive: true },
];
