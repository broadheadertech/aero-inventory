"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiSummaryCard } from "./kpi-summary-card";
import { BranchHealthCard } from "./branch-health-card";
import { SellThruTable } from "./sell-thru-table";
import { useNetworkDashboardStore } from "@/lib/stores/use-network-dashboard-store";
import type { SellThruNetworkRow } from "@/lib/types/sell-thru";

type BranchSummary = {
  branchId: string;
  branchName: string;
  fastCount: number;
  midCount: number;
  slowCount: number;
  total: number;
  isWarehouse: boolean;
};

export function AdminNetworkDashboard() {
  const store = useNetworkDashboardStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [classificationFilter, setClassificationFilter] = useState<
    "Fast" | "Mid" | "Slow" | null
  >(null);

  const rawRows = useQuery(api.queries.getSellThruNetwork.getSellThruNetwork, {
    timePeriod: store.timePeriod || undefined,
    department: store.departmentFilter || undefined,
    category: store.categoryFilter || undefined,
    collection: store.collectionFilter || undefined,
    // Branch filtering is done client-side to avoid query re-subscription on drill-down
  });
  const rows = rawRows as SellThruNetworkRow[] | undefined;

  // Scope-filtered rows (branch filter applied, no classification filter)
  // Used for KPI counts so they reflect the current branch scope during drill-down
  const scopedRows = useMemo<SellThruNetworkRow[]>(() => {
    if (!rows) return [];
    const activeBranch = store.drillDownBranchId || store.branchFilter;
    if (!activeBranch) return rows;
    return rows.filter((r) => r.branchId === activeBranch);
  }, [rows, store.drillDownBranchId, store.branchFilter]);

  // KPI counts — derived from branch-scoped rows (before classification filter)
  const { total, fastCount, midCount, slowCount } = useMemo(() => {
    return {
      total: scopedRows.length,
      fastCount: scopedRows.filter((r) => r.classification === "Fast").length,
      midCount: scopedRows.filter((r) => r.classification === "Mid").length,
      slowCount: scopedRows.filter((r) => r.classification === "Slow").length,
    };
  }, [scopedRows]);

  // Branch summaries — grouped by branchId, sorted alphabetically
  const branchSummaries = useMemo<BranchSummary[]>(() => {
    if (!rows) return [];
    const map = new Map<string, BranchSummary>();
    for (const row of rows) {
      const key = row.branchId;
      if (!map.has(key)) {
        map.set(key, {
          branchId: key,
          branchName: row.branchName,
          fastCount: 0,
          midCount: 0,
          slowCount: 0,
          total: 0,
          isWarehouse: false,
        });
      }
      const entry = map.get(key)!;
      entry.total++;
      if (row.classification === "Fast") entry.fastCount++;
      else if (row.classification === "Mid") entry.midCount++;
      else if (row.classification === "Slow") entry.slowCount++;
      if ((row as { branchType?: string }).branchType === "warehouse") entry.isWarehouse = true;
    }
    return [...map.values()].sort((a, b) =>
      a.branchName.localeCompare(b.branchName)
    );
  }, [rows]);

  // Unique filter options derived from rows
  const uniqueDepartments = useMemo(
    () => [...new Set((rows ?? []).map((r) => r.department).filter(Boolean))].sort(),
    [rows]
  );
  const uniqueCategories = useMemo(
    () => [...new Set((rows ?? []).map((r) => r.category).filter(Boolean))].sort(),
    [rows]
  );
  const uniqueCollections = useMemo(
    () => [...new Set((rows ?? []).map((r) => r.collection).filter(Boolean))].sort(),
    [rows]
  );

  // Filtered rows — scopedRows + classification filter
  const filteredRows = useMemo<SellThruNetworkRow[]>(() => {
    if (!classificationFilter) return scopedRows;
    return scopedRows.filter((r) => r.classification === classificationFilter);
  }, [scopedRows, classificationFilter]);

  // Sorted rows
  const sortedRows = useMemo<SellThruNetworkRow[]>(() => {
    if (!filteredRows.length) return filteredRows;
    const dir = store.sortDirection === "asc" ? 1 : -1;
    return [...filteredRows].sort((a, b) => {
      switch (store.sortColumn) {
        case "sellThruPercent": {
          const aVal =
            a.sellThruPercent ??
            (store.sortDirection === "asc" ? Infinity : -Infinity);
          const bVal =
            b.sellThruPercent ??
            (store.sortDirection === "asc" ? Infinity : -Infinity);
          return (aVal - bVal) * dir;
        }
        case "branchName":
          return a.branchName.localeCompare(b.branchName) * dir;
        case "styleCode":
          return a.styleCode.localeCompare(b.styleCode) * dir;
        case "productName":
          return a.productName.localeCompare(b.productName) * dir;
        case "classification":
          return a.classification.localeCompare(b.classification) * dir;
        case "weeksOnFloor": {
          const aW =
            a.weeksOnFloor ??
            (store.sortDirection === "asc" ? Infinity : -Infinity);
          const bW =
            b.weeksOnFloor ??
            (store.sortDirection === "asc" ? Infinity : -Infinity);
          return (aW - bW) * dir;
        }
        case "beginningStock":
          return (a.beginningStock - b.beginningStock) * dir;
        case "sold":
          return (a.sold - b.sold) * dir;
        case "currentSOH":
          return (a.currentSOH - b.currentSOH) * dir;
        case "ads": {
          const aA = a.ads ?? (store.sortDirection === "asc" ? Infinity : -Infinity);
          const bA = b.ads ?? (store.sortDirection === "asc" ? Infinity : -Infinity);
          return (aA - bA) * dir;
        }
        case "dsi": {
          const aD = a.dsi ?? (store.sortDirection === "asc" ? Infinity : -Infinity);
          const bD = b.dsi ?? (store.sortDirection === "asc" ? Infinity : -Infinity);
          return (aD - bD) * dir;
        }
        case "mi": {
          const aMi = a.mi ?? (store.sortDirection === "asc" ? Infinity : -Infinity);
          const bMi = b.mi ?? (store.sortDirection === "asc" ? Infinity : -Infinity);
          return (aMi - bMi) * dir;
        }
        default:
          return 0;
      }
    });
  }, [filteredRows, store.sortColumn, store.sortDirection]);

  const handleKpiClick = (classification: "Fast" | "Mid" | "Slow") => {
    setClassificationFilter(
      classificationFilter === classification ? null : classification
    );
    setExpandedId(null);
  };

  const handleDrillDown = (branchId: string, branchName: string) => {
    store.setDrillDown(branchId, branchName);
    setClassificationFilter(null);
    setExpandedId(null);
  };

  const handleClearDrillDown = () => {
    store.clearDrillDown();
    setClassificationFilter(null);
    setExpandedId(null);
  };

  const handleReset = () => {
    store.resetFilters();
    setClassificationFilter(null);
    setExpandedId(null);
  };

  // Loading skeleton
  if (rows === undefined) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
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
      {/* Breadcrumb / Heading */}
      {store.drillDownBranchId ? (
        <nav
          className="flex items-center gap-1 text-sm text-muted-foreground mb-1"
          aria-label="Dashboard breadcrumb"
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
      ) : (
        <h1 className="text-2xl font-semibold tracking-tight">
          Network Overview
        </h1>
      )}

      {/* KPI cards */}
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

      {/* Branch Health Cards — hidden during drill-down */}
      {!store.drillDownBranchId && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {branchSummaries.map((branch) => (
            <BranchHealthCard
              key={branch.branchId}
              branchId={branch.branchId}
              branchName={branch.branchName}
              fastCount={branch.fastCount}
              midCount={branch.midCount}
              slowCount={branch.slowCount}
              total={branch.total}
              isWarehouse={branch.isWarehouse}
              onClick={() => handleDrillDown(branch.branchId, branch.branchName)}
            />
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Time Period */}
        <select
          value={store.timePeriod}
          onChange={(e) => store.setTimePeriod(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
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
          onChange={(e) => store.setBranchFilter(e.target.value)}
          disabled={!!store.drillDownBranchId}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Filter by branch"
        >
          <option value="">All Branches</option>
          {branchSummaries.map((b) => (
            <option key={b.branchId} value={b.branchId}>
              {b.branchName}
            </option>
          ))}
        </select>

        {/* Department filter */}
        <select
          value={store.departmentFilter}
          onChange={(e) => store.setDepartmentFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          aria-label="Filter by department"
        >
          <option value="">All Departments</option>
          {uniqueDepartments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        {/* Category filter */}
        <select
          value={store.categoryFilter}
          onChange={(e) => store.setCategoryFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {uniqueCategories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Collection filter */}
        <select
          value={store.collectionFilter}
          onChange={(e) => store.setCollectionFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
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
      </div>

      {/* Sell-Thru Table */}
      <SellThruTable
        rows={sortedRows}
        expandedId={expandedId}
        onToggleExpand={(id) =>
          setExpandedId((prev) => (prev === id ? null : id))
        }
        sortColumn={store.sortColumn}
        sortDirection={store.sortDirection}
        onSort={store.handleSort}
        showBranch={!store.drillDownBranchId}
      />
    </div>
  );
}
