import type { Doc } from "../_generated/dataModel";

export type PnLSummary = {
  totalRevenue: number;
  totalCost: number;
  totalMargin: number;
  marginPercent: number;
};

export type PnLRow = {
  key: string;
  label: string;
  revenue: number;
  cost: number;
  margin: number;
  marginPercent: number;
  unitsSold: number;
};

/**
 * _computeMargin — margin % = (revenue - cost) / revenue * 100
 */
export function _computeMargin(revenue: number, cost: number): number {
  if (revenue === 0) return 0;
  return Math.round(((revenue - cost) / revenue) * 100 * 100) / 100;
}

/**
 * _aggregatePnL — compute P&L from sales entries joined with products.
 * Revenue = sum(salePrice * quantitySold) — salePrice is in centavos
 * Cost = sum(product.unitCost * quantitySold) — unitCost is in centavos
 */
export function _aggregatePnL(
  entries: Doc<"salesEntries">[],
  productMap: Map<string, Doc<"products">>
): PnLSummary {
  let totalRevenue = 0;
  let totalCost = 0;

  for (const entry of entries) {
    const product = productMap.get(entry.productId);
    if (!product) continue;
    totalRevenue += entry.salePrice * entry.quantitySold;
    totalCost += product.unitCost * entry.quantitySold;
  }

  return {
    totalRevenue,
    totalCost,
    totalMargin: totalRevenue - totalCost,
    marginPercent: _computeMargin(totalRevenue, totalCost),
  };
}

/**
 * _aggregatePnLByDimension — group entries by a dimension and compute P&L per group.
 */
export function _aggregatePnLByDimension(
  entries: Doc<"salesEntries">[],
  productMap: Map<string, Doc<"products">>,
  branchMap: Map<string, Doc<"branches">>,
  dimension: "department" | "category" | "collection" | "branch"
): PnLRow[] {
  const groups = new Map<string, { revenue: number; cost: number; unitsSold: number }>();

  for (const entry of entries) {
    const product = productMap.get(entry.productId);
    if (!product) continue;

    let key: string;
    if (dimension === "branch") {
      const branch = branchMap.get(entry.branchId);
      key = branch?.name ?? entry.branchId;
    } else {
      key = product[dimension];
    }

    const existing = groups.get(key) ?? { revenue: 0, cost: 0, unitsSold: 0 };
    existing.revenue += entry.salePrice * entry.quantitySold;
    existing.cost += product.unitCost * entry.quantitySold;
    existing.unitsSold += entry.quantitySold;
    groups.set(key, existing);
  }

  const rows: PnLRow[] = [];
  for (const [label, data] of groups) {
    rows.push({
      key: label,
      label,
      revenue: data.revenue,
      cost: data.cost,
      margin: data.revenue - data.cost,
      marginPercent: _computeMargin(data.revenue, data.cost),
      unitsSold: data.unitsSold,
    });
  }

  // Sort by margin descending
  rows.sort((a, b) => b.margin - a.margin);
  return rows;
}
