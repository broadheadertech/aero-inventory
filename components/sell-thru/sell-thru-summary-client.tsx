"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useSellThruStore } from "@/lib/stores/use-sell-thru-store";
import { SellThruFilterBar } from "./sell-thru-filter-bar";
import { SellThruSummaryTable } from "./sell-thru-summary-table";
import { ExportExcelButton } from "@/components/export/export-excel-button";
import { ExportPdfButton } from "@/components/export/export-pdf-button";
import type { ReportExportConfig } from "@/lib/types/export";
import type { SellThruRow } from "@/lib/types/sell-thru";

export function SellThruSummaryClient() {
  const {
    department,
    category,
    collection,
    timePeriod,
    classificationFilter,
  } = useSellThruStore();

  // Local sort state — report columns differ from dashboard, so sort must not leak across pages
  const [sortColumn, setSortColumn] = useState("sellThruPercent");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | "default">("default");

  const rawRows = useQuery(api.queries.getSellThruByBranch.getSellThruByBranch, {
    timePeriod: timePeriod || undefined,
    department: department || undefined,
    category: category || undefined,
    collection: collection || undefined,
  });
  const rows = rawRows as SellThruRow[] | undefined;

  const handleSort = (col: string) => {
    if (sortColumn !== col) {
      setSortColumn(col);
      setSortDirection("asc");
    } else if (sortDirection === "asc") {
      setSortDirection("desc");
    } else if (sortDirection === "desc") {
      setSortDirection("default");
      setSortColumn("sellThruPercent");
    } else {
      setSortDirection("asc");
    }
  };

  const filteredRows = useMemo<SellThruRow[]>(() => {
    if (!rows) return [];
    return classificationFilter
      ? rows.filter((r) => r.classification === classificationFilter)
      : rows;
  }, [rows, classificationFilter]);

  const sortedRows = useMemo<SellThruRow[]>(() => {
    if (sortDirection === "default") {
      return [...filteredRows].sort((a, b) => {
        const aVal = a.sellThruPercent ?? Infinity;
        const bVal = b.sellThruPercent ?? Infinity;
        return aVal - bVal;
      });
    }

    const multiplier = sortDirection === "asc" ? 1 : -1;

    return [...filteredRows].sort((a, b) => {
      let aVal: string | number | null;
      let bVal: string | number | null;

      switch (sortColumn) {
        case "styleCode":          aVal = a.styleCode;          bVal = b.styleCode;          break;
        case "productName":        aVal = a.productName;        bVal = b.productName;        break;
        case "beginningStock":     aVal = a.beginningStock;     bVal = b.beginningStock;     break;
        case "sold":               aVal = a.sold;               bVal = b.sold;               break;
        case "currentSOH":         aVal = a.currentSOH;         bVal = b.currentSOH;         break;
        case "sellThruPercent":    aVal = a.sellThruPercent;    bVal = b.sellThruPercent;    break;
        case "classification":
        case "agingPolicy":        aVal = a.classification;     bVal = b.classification;     break;
        case "age":
        case "weeksOnFloor":       aVal = a.weeksOnFloor;       bVal = b.weeksOnFloor;       break;
        case "deliveryInStoreDate":aVal = a.deliveryInStoreDate; bVal = b.deliveryInStoreDate; break;
        case "retailPrice":
        case "currentSrp":        aVal = a.retailPrice;        bVal = b.retailPrice;        break;
        case "margin":             aVal = a.retailPrice - a.unitCost; bVal = b.retailPrice - b.unitCost; break;
        case "remarks":            aVal = a.remark;             bVal = b.remark;             break;
        default:                   aVal = a.sellThruPercent;    bVal = b.sellThruPercent;    break;
      }

      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      if (typeof aVal === "string" && typeof bVal === "string") {
        return multiplier * aVal.localeCompare(bVal);
      }
      return multiplier * ((aVal as number) - (bVal as number));
    });
  }, [filteredRows, sortColumn, sortDirection]);

  const getExportConfig = (): ReportExportConfig => ({
    reportName: "Sell-Thru Summary",
    columns: [
      { header: "Style Code", key: "styleCode", type: "string" },
      { header: "Description", key: "productName", type: "string" },
      { header: "BEG", key: "beginningStock", type: "number" },
      { header: "SOLD", key: "sold", type: "number" },
      { header: "SOH", key: "currentSOH", type: "number" },
      { header: "Sell-Thru %", key: "sellThruPercent", type: "percent" },
      { header: "Age (Weeks)", key: "weeksOnFloor", type: "number" },
      { header: "Classification", key: "classification", type: "string" },
      { header: "Remarks", key: "remark", type: "string" },
      { header: "SRP", key: "retailPrice", type: "currency" },
      { header: "Margin", key: "margin", type: "currency" },
      { header: "Delivery in Store", key: "deliveryInStoreDate", type: "date" },
    ],
    rows: sortedRows.map((r) => ({ ...r, margin: r.retailPrice - r.unitCost })),
    filters: {
      ...(classificationFilter ? { Classification: classificationFilter } : {}),
      ...(department ? { Department: department } : {}),
      ...(category ? { Category: category } : {}),
      ...(collection ? { Collection: collection } : {}),
    },
    timePeriod: timePeriod || "weekly",
  });

  if (rows === undefined) {
    return (
      <div className="flex flex-col gap-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <SellThruFilterBar rows={rows} showClassificationSelect />
        <div className="flex gap-2">
          <ExportExcelButton getConfig={getExportConfig} />
          <ExportPdfButton getConfig={getExportConfig} />
        </div>
      </div>
      <SellThruSummaryTable
        rows={sortedRows}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
      />
    </div>
  );
}
