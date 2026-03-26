"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useNetworkDashboardStore } from "@/lib/stores/use-network-dashboard-store";
import { SellThruSummaryTable } from "./sell-thru-summary-table";
import { ExportExcelButton } from "@/components/export/export-excel-button";
import { ExportPdfButton } from "@/components/export/export-pdf-button";
import type { ReportExportConfig } from "@/lib/types/export";
import type { SellThruNetworkRow } from "@/lib/types/sell-thru";

const SELECT_CLASS =
  "rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring";

export function NetworkSummaryClient() {
  const store = useNetworkDashboardStore();
  const [classificationFilter, setClassificationFilter] = useState<
    "Fast" | "Mid" | "Slow" | null
  >(null);

  const rawRows = useQuery(
    api.queries.getSellThruNetwork.getSellThruNetwork,
    {
      timePeriod: store.timePeriod || undefined,
      department: store.departmentFilter || undefined,
      category: store.categoryFilter || undefined,
      collection: store.collectionFilter || undefined,
    }
  );
  const rows = rawRows as SellThruNetworkRow[] | undefined;

  // Unique branch options for filter dropdown
  const branchOptions = useMemo(() => {
    if (!rows) return [];
    const seen = new Map<string, string>();
    for (const row of rows) {
      const id = row.branchId as string;
      if (!seen.has(id)) seen.set(id, row.branchName);
    }
    return [...seen.entries()]
      .map(([branchId, branchName]) => ({ branchId, branchName }))
      .sort((a, b) => a.branchName.localeCompare(b.branchName));
  }, [rows]);

  // Unique filter options derived from rows
  const uniqueDepartments = useMemo(
    () =>
      [...new Set((rows ?? []).map((r) => r.department).filter(Boolean))].sort(),
    [rows]
  );
  const uniqueCategories = useMemo(
    () =>
      [...new Set((rows ?? []).map((r) => r.category).filter(Boolean))].sort(),
    [rows]
  );
  const uniqueCollections = useMemo(
    () =>
      [...new Set((rows ?? []).map((r) => r.collection).filter(Boolean))].sort(),
    [rows]
  );

  // Scope-filtered rows (branch filter applied)
  const scopedRows = useMemo<SellThruNetworkRow[]>(() => {
    if (!rows) return [];
    const activeBranch = store.drillDownBranchId || store.branchFilter;
    if (!activeBranch) return rows;
    return rows.filter((r) => (r.branchId as string) === activeBranch);
  }, [rows, store.drillDownBranchId, store.branchFilter]);

  // Classification filter
  const classifiedRows = useMemo<SellThruNetworkRow[]>(() => {
    if (!classificationFilter) return scopedRows;
    return scopedRows.filter((r) => r.classification === classificationFilter);
  }, [scopedRows, classificationFilter]);

  // Sorted rows
  const sortedRows = useMemo<SellThruNetworkRow[]>(() => {
    if (!classifiedRows.length) return classifiedRows;
    const dir = store.sortDirection === "asc" ? 1 : -1;
    return [...classifiedRows].sort((a, b) => {
      let aVal: string | number | null;
      let bVal: string | number | null;

      switch (store.sortColumn) {
        case "branchName":
          return a.branchName.localeCompare(b.branchName) * dir;
        case "styleCode":
          aVal = a.styleCode;
          bVal = b.styleCode;
          break;
        case "productName":
          aVal = a.productName;
          bVal = b.productName;
          break;
        case "beginningStock":
          aVal = a.beginningStock;
          bVal = b.beginningStock;
          break;
        case "sold":
          aVal = a.sold;
          bVal = b.sold;
          break;
        case "currentSOH":
          aVal = a.currentSOH;
          bVal = b.currentSOH;
          break;
        case "sellThruPercent":
          aVal = a.sellThruPercent;
          bVal = b.sellThruPercent;
          break;
        case "classification":
        case "agingPolicy":
          aVal = a.classification;
          bVal = b.classification;
          break;
        case "age":
        case "weeksOnFloor":
          aVal = a.weeksOnFloor;
          bVal = b.weeksOnFloor;
          break;
        case "deliveryInStoreDate":
          aVal = a.deliveryInStoreDate;
          bVal = b.deliveryInStoreDate;
          break;
        case "retailPrice":
        case "currentSrp":
          aVal = a.retailPrice;
          bVal = b.retailPrice;
          break;
        case "margin":
          aVal = a.retailPrice - a.unitCost;
          bVal = b.retailPrice - b.unitCost;
          break;
        case "remarks":
          aVal = a.remark;
          bVal = b.remark;
          break;
        default:
          aVal = a.sellThruPercent;
          bVal = b.sellThruPercent;
          break;
      }

      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      if (typeof aVal === "string" && typeof bVal === "string") {
        return aVal.localeCompare(bVal) * dir;
      }
      return ((aVal as number) - (bVal as number)) * dir;
    });
  }, [classifiedRows, store.sortColumn, store.sortDirection]);

  const handleBranchClick = (branchId: string, branchName: string) => {
    store.setDrillDown(branchId, branchName);
    setClassificationFilter(null);
  };

  const handleClearDrillDown = () => {
    store.clearDrillDown();
    setClassificationFilter(null);
  };

  const handleReset = () => {
    store.resetFilters();
    setClassificationFilter(null);
  };

  const getExportConfig = (): ReportExportConfig => ({
    reportName: "Network Sell-Thru Summary",
    columns: [
      { header: "Branch", key: "branchName", type: "string" },
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
      ...(store.branchFilter || store.drillDownBranchId
        ? {
            Branch:
              store.drillDownBranchName ||
              branchOptions.find((b) => b.branchId === store.branchFilter)
                ?.branchName ||
              store.branchFilter,
          }
        : {}),
      ...(classificationFilter ? { Classification: classificationFilter } : {}),
      ...(store.departmentFilter ? { Department: store.departmentFilter } : {}),
      ...(store.categoryFilter ? { Category: store.categoryFilter } : {}),
      ...(store.collectionFilter ? { Collection: store.collectionFilter } : {}),
    },
    timePeriod: store.timePeriod || "weekly",
  });

  // Loading skeleton
  if (rows === undefined) {
    return (
      <div className="flex flex-col gap-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Breadcrumb — drill-down active */}
      {store.drillDownBranchId ? (
        <nav
          className="flex items-center gap-1 text-sm text-muted-foreground mb-1"
          aria-label="Reports breadcrumb"
        >
          <button
            type="button"
            onClick={handleClearDrillDown}
            className="hover:text-foreground hover:underline transition-colors font-medium"
          >
            Network
          </button>
          <span aria-hidden="true">›</span>
          <span className="text-foreground font-semibold">
            {store.drillDownBranchName}
          </span>
        </nav>
      ) : null}

      {/* Filter bar — inline selects matching AdminNetworkDashboard pattern */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Time Period */}
        <select
          value={store.timePeriod}
          onChange={(e) => store.setTimePeriod(e.target.value)}
          className={SELECT_CLASS}
          aria-label="Time period"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
        </select>

        {/* Branch filter — disabled during drill-down */}
        <select
          value={store.branchFilter}
          onChange={(e) => {
            store.setBranchFilter(e.target.value);
            setClassificationFilter(null);
          }}
          disabled={!!store.drillDownBranchId}
          className={`${SELECT_CLASS} disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label="Filter by branch"
        >
          <option value="">All Branches</option>
          {branchOptions.map((b) => (
            <option key={b.branchId} value={b.branchId}>
              {b.branchName}
            </option>
          ))}
        </select>

        {/* Classification */}
        <select
          value={classificationFilter ?? ""}
          onChange={(e) =>
            setClassificationFilter(
              e.target.value === ""
                ? null
                : (e.target.value as "Fast" | "Mid" | "Slow")
            )
          }
          className={SELECT_CLASS}
          aria-label="Filter by classification"
        >
          <option value="">All Classifications</option>
          <option value="Fast">Fast</option>
          <option value="Mid">Mid</option>
          <option value="Slow">Slow</option>
        </select>

        {/* Department */}
        <select
          value={store.departmentFilter}
          onChange={(e) => store.setDepartmentFilter(e.target.value)}
          className={SELECT_CLASS}
          aria-label="Filter by department"
        >
          <option value="">All Departments</option>
          {uniqueDepartments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        {/* Category */}
        <select
          value={store.categoryFilter}
          onChange={(e) => store.setCategoryFilter(e.target.value)}
          className={SELECT_CLASS}
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {uniqueCategories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Collection */}
        <select
          value={store.collectionFilter}
          onChange={(e) => store.setCollectionFilter(e.target.value)}
          className={SELECT_CLASS}
          aria-label="Filter by collection"
        >
          <option value="">All Collections</option>
          {uniqueCollections.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Reset */}
        <button
          type="button"
          onClick={handleReset}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm hover:bg-muted transition-colors"
        >
          Reset
        </button>

        <ExportExcelButton getConfig={getExportConfig} />
        <ExportPdfButton getConfig={getExportConfig} />
      </div>

      {/* Summary Table */}
      <SellThruSummaryTable
        rows={sortedRows}
        showBranch={!store.drillDownBranchId}
        onBranchClick={handleBranchClick}
        sortColumn={store.sortColumn}
        sortDirection={store.sortDirection}
        onSort={store.handleSort}
      />
    </div>
  );
}
