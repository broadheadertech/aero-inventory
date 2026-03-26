"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiSummaryCard } from "./kpi-summary-card";
import { SellThruTable } from "./sell-thru-table";
import { SellThruFilterBar } from "./sell-thru-filter-bar";
import { useSellThruStore } from "@/lib/stores/use-sell-thru-store";
import type { SellThruRow } from "@/lib/types/sell-thru";

export function ManagerDashboard() {
  const {
    department,
    category,
    collection,
    timePeriod,
    sortColumn,
    sortDirection,
    classificationFilter,
    setSortColumn,
    setSortDirection,
    setClassificationFilter,
  } = useSellThruStore();

  const rawRows = useQuery(api.queries.getSellThruByBranch.getSellThruByBranch, {
    timePeriod: timePeriod || undefined,
    department: department || undefined,
    category: category || undefined,
    collection: collection || undefined,
  });
  const rows = rawRows as SellThruRow[] | undefined;

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleKpiClick = (classification: "Fast" | "Mid" | "Slow") => {
    setClassificationFilter(classificationFilter === classification ? null : classification);
    setExpandedId(null);
  };

  const handleToggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

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

  const total = rows?.length;
  const fastCount = rows?.filter((r) => r.classification === "Fast").length;
  const midCount = rows?.filter((r) => r.classification === "Mid").length;
  const slowCount = rows?.filter((r) => r.classification === "Slow").length;

  const filteredRows = useMemo<SellThruRow[]>(() => {
    if (!rows) return [];
    return classificationFilter
      ? rows.filter((r) => r.classification === classificationFilter)
      : rows;
  }, [rows, classificationFilter]);

  const sortedRows = useMemo<SellThruRow[]>(() => {
    if (sortDirection === "default") {
      // Default: sell-thru % ascending (worst performers first), nulls last
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
        case "styleCode":       aVal = a.styleCode;        bVal = b.styleCode;        break;
        case "productName":     aVal = a.productName;      bVal = b.productName;      break;
        case "beginningStock":  aVal = a.beginningStock;   bVal = b.beginningStock;   break;
        case "sold":            aVal = a.sold;             bVal = b.sold;             break;
        case "currentSOH":      aVal = a.currentSOH;       bVal = b.currentSOH;       break;
        case "sellThruPercent": aVal = a.sellThruPercent;  bVal = b.sellThruPercent;  break;
        case "classification":  aVal = a.classification;   bVal = b.classification;   break;
        case "weeksOnFloor":    aVal = a.weeksOnFloor;     bVal = b.weeksOnFloor;     break;
        case "ads":             aVal = a.ads;              bVal = b.ads;              break;
        case "dsi":             aVal = a.dsi;              bVal = b.dsi;              break;
        case "mi":              aVal = a.mi;               bVal = b.mi;               break;
        default:                aVal = a.sellThruPercent;  bVal = b.sellThruPercent;  break;
      }

      // Nulls go to bottom regardless of sort direction
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      if (typeof aVal === "string" && typeof bVal === "string") {
        return multiplier * aVal.localeCompare(bVal);
      }
      return multiplier * ((aVal as number) - (bVal as number));
    });
  }, [filteredRows, sortColumn, sortDirection]);

  if (rows === undefined) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiSummaryCard
          label="Total Products"
          count={total}
          colorScheme="neutral"
          isActive={false}
          onClick={() => {}}
          disabled
        />
        <KpiSummaryCard
          label="Fast"
          count={fastCount}
          colorScheme="fast"
          isActive={classificationFilter === "Fast"}
          onClick={() => handleKpiClick("Fast")}
        />
        <KpiSummaryCard
          label="Mid"
          count={midCount}
          colorScheme="mid"
          isActive={classificationFilter === "Mid"}
          onClick={() => handleKpiClick("Mid")}
        />
        <KpiSummaryCard
          label="Slow"
          count={slowCount}
          colorScheme="slow"
          isActive={classificationFilter === "Slow"}
          onClick={() => handleKpiClick("Slow")}
        />
      </div>

      {/* Filter bar — pass all rows (pre-classification-filter) for deriving options */}
      <SellThruFilterBar rows={rows} />

      <SellThruTable
        rows={sortedRows}
        expandedId={expandedId}
        onToggleExpand={handleToggleExpand}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
      />
    </div>
  );
}
