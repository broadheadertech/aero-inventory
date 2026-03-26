import type { Doc } from "@/convex/_generated/dataModel";

/**
 * Enriched row type returned by listAllBranchProducts query.
 * Do NOT use Awaited<ReturnType<...>> — use this explicit intersection type.
 */
export type StockRow = Doc<"branchProducts"> & {
  product: Doc<"products"> | null;
  branch: Doc<"branches"> | null;
  totalSold: number;
};
