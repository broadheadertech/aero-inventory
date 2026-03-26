"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useStockOverviewStore } from "@/lib/stores/use-stock-overview-store";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExportExcelButton } from "@/components/export/export-excel-button";
import { ExportPdfButton } from "@/components/export/export-pdf-button";
import type { ReportExportConfig } from "@/lib/types/export";
import type { StockRow } from "@/lib/types/stock-overview";

export function AdminStockOverviewTable() {
  const rows = useQuery(api.queries.listAllBranchProducts.listAllBranchProducts);

  const {
    searchQuery,
    branchFilter,
    departmentFilter,
    categoryFilter,
    collectionFilter,
  } = useStockOverviewStore();

  const filtered = useMemo(() => {
    if (!rows) return [];
    return (rows as StockRow[]).filter((row) => {
      const searchLower = searchQuery.toLowerCase();
      if (searchQuery) {
        const matchesStyleCode = row.product?.styleCode?.toLowerCase().includes(searchLower);
        const matchesName = row.product?.name?.toLowerCase().includes(searchLower);
        if (!matchesStyleCode && !matchesName) return false;
      }
      if (branchFilter && row.branchId !== branchFilter) return false;
      if (departmentFilter && row.product?.department !== departmentFilter) return false;
      if (categoryFilter && row.product?.category !== categoryFilter) return false;
      if (collectionFilter && row.product?.collection !== collectionFilter) return false;
      return true;
    });
  }, [rows, searchQuery, branchFilter, departmentFilter, categoryFilter, collectionFilter]);

  const getExportConfig = (): ReportExportConfig => ({
    reportName: "Stock Overview",
    columns: [
      { header: "Branch", key: "branchName", type: "string" },
      { header: "Style Code", key: "styleCode", type: "string" },
      { header: "Description", key: "productName", type: "string" },
      { header: "Department", key: "department", type: "string" },
      { header: "BEG", key: "beginningStock", type: "number" },
      { header: "SOLD", key: "totalSold", type: "number" },
      { header: "SOH", key: "currentSOH", type: "number" },
    ],
    rows: filtered.map((row) => ({
      branchName: row.branch?.name ?? "",
      styleCode: row.product?.styleCode ?? "",
      productName: row.product?.name ?? "",
      department: row.product?.department ?? "",
      beginningStock: row.beginningStock,
      totalSold: row.totalSold,
      currentSOH: row.currentSOH,
    })),
    filters: {
      ...(searchQuery ? { Search: searchQuery } : {}),
      ...(branchFilter
        ? { Branch: filtered[0]?.branch?.name ?? branchFilter }
        : {}),
      ...(departmentFilter ? { Department: departmentFilter } : {}),
      ...(categoryFilter ? { Category: categoryFilter } : {}),
      ...(collectionFilter ? { Collection: collectionFilter } : {}),
    },
  });

  if (rows === undefined) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    const hasActiveFilters =
      !!searchQuery ||
      !!branchFilter ||
      !!departmentFilter ||
      !!categoryFilter ||
      !!collectionFilter;
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {hasActiveFilters
          ? "No stock data matches the current filters."
          : "No stock data found. Assign products to branches to see inventory."}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-end gap-2 mb-2">
        <ExportExcelButton getConfig={getExportConfig} />
        <ExportPdfButton getConfig={getExportConfig} />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Branch</TableHead>
            <TableHead>Style Code</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Department</TableHead>
            <TableHead className="text-right">BEG</TableHead>
            <TableHead className="text-right">SOLD</TableHead>
            <TableHead className="text-right">SOH</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((row) => (
            <TableRow key={row._id}>
              <TableCell className="text-sm">
                {row.branch?.name ?? "—"}
              </TableCell>
              <TableCell className="font-mono text-sm font-medium">
                <div className="flex items-center gap-2">
                  {row.product?.imageUrl ? (
                    <img src={row.product.imageUrl} alt="" className="h-8 w-8 rounded object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-[10px] font-medium text-muted-foreground">
                      {(row.product?.styleCode ?? "").slice(-3)}
                    </div>
                  )}
                  {row.product?.styleCode ?? "—"}
                </div>
              </TableCell>
              <TableCell className="text-sm">
                {row.product?.name ?? "—"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {row.product?.department ?? "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.beginningStock}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.totalSold}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.currentSOH}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
