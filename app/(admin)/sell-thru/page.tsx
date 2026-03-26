"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AdminNetworkDashboard } from "@/components/sell-thru/admin-network-dashboard";
import { SellThruSummaryClient } from "@/components/sell-thru/sell-thru-summary-client";
import { NetworkSummaryClient } from "@/components/sell-thru/network-summary-client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginatedTable } from "@/components/shared/paginated-table";
import { Search, X } from "lucide-react";

type Tab = "live" | "branch-summary" | "network-summary" | "search";

export default function SellThruPage() {
  const [tab, setTab] = useState<Tab>("live");
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sell-Thru</h1>
          <p className="text-muted-foreground">
            Monitor sell-through performance, classification, and aging across the network
          </p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search product or style code..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (e.target.value.length > 0) setTab("search");
              else setTab("live");
            }}
            className="pl-8 pr-8"
          />
          {search && (
            <button
              onClick={() => { setSearch(""); setTab("live"); }}
              className="absolute right-2.5 top-2.5"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
      </div>

      {tab !== "search" && (
        <div className="flex gap-1 rounded-lg border bg-muted p-1">
          {[
            { key: "live" as Tab, label: "Live Dashboard" },
            { key: "branch-summary" as Tab, label: "Branch Summary" },
            { key: "network-summary" as Tab, label: "Network Summary" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {tab === "search" && <ProductSearchResults query={search} />}
      {tab === "live" && <AdminNetworkDashboard />}
      {tab === "branch-summary" && <SellThruSummaryClient />}
      {tab === "network-summary" && <NetworkSummaryClient />}
    </div>
  );
}

type ViewMode = "overall" | string; // "overall" or branchId

function ProductSearchResults({ query }: { query: string }) {
  const rawRows = useQuery(api.queries.getSellThruNetwork.getSellThruNetwork, {});
  const branches = useQuery(api.queries.listAllBranches.listAllBranches, {});
  const [viewMode, setViewMode] = useState<ViewMode>("overall");

  // Filter by search query
  const matchedRows = useMemo(() => {
    if (!rawRows || !query) return [];
    const q = query.toLowerCase();
    return rawRows.filter(
      (r: Record<string, unknown>) =>
        (r.productName as string)?.toLowerCase().includes(q) ||
        (r.styleCode as string)?.toLowerCase().includes(q)
    );
  }, [rawRows, query]);

  // Group by product for overall view
  const overallResults = useMemo(() => {
    if (viewMode !== "overall") return [];
    const map = new Map<string, {
      productName: string;
      styleCode: string;
      department: string;
      category: string;
      imageUrl: string | null;
      warehouseArrivalDate: string | null;
      totalBeg: number;
      totalSold: number;
      totalSOH: number;
      branchCount: number;
      classifications: string[];
      earliestBranchArrival: string | null;
    }>();

    for (const r of matchedRows) {
      const row = r as Record<string, unknown>;
      const key = row.styleCode as string;
      const existing = map.get(key) ?? {
        productName: row.productName as string,
        styleCode: key,
        department: row.department as string ?? "",
        category: row.category as string ?? "",
        imageUrl: (row.imageUrl as string) ?? null,
        warehouseArrivalDate: (row.warehouseArrivalDate as string) ?? null,
        totalBeg: 0,
        totalSold: 0,
        totalSOH: 0,
        branchCount: 0,
        classifications: [],
        earliestBranchArrival: null,
      };
      existing.totalBeg += (row.beginningStock as number) ?? 0;
      existing.totalSold += (row.sold as number) ?? 0;
      existing.totalSOH += (row.currentSOH as number) ?? 0;
      existing.branchCount++;
      if (row.classification) existing.classifications.push(row.classification as string);
      const branchArrival = row.deliveryInStoreDate as string | null;
      if (branchArrival && (!existing.earliestBranchArrival || branchArrival < existing.earliestBranchArrival)) {
        existing.earliestBranchArrival = branchArrival;
      }
      map.set(key, existing);
    }

    return Array.from(map.values()).map((p) => {
      const sellThru = p.totalBeg > 0 ? (p.totalSold / p.totalBeg) * 100 : 0;
      const classification = sellThru >= 60 ? "Fast" : sellThru >= 30 ? "Mid" : "Slow";
      return { ...p, sellThru, classification };
    }).sort((a, b) => b.sellThru - a.sellThru);
  }, [matchedRows, viewMode]);

  // Per-branch view
  const branchResults = useMemo(() => {
    if (viewMode === "overall") return [];
    return matchedRows
      .filter((r: Record<string, unknown>) => (r.branchId as string) === viewMode)
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
        ((b.sellThruPercent as number) ?? 0) - ((a.sellThruPercent as number) ?? 0)
      );
  }, [matchedRows, viewMode]);

  // Get branches that have matching products — must be before any early returns
  const branchesWithResults = useMemo(() => {
    const ids = new Set(matchedRows.map((r: Record<string, unknown>) => r.branchId as string));
    return (branches ?? []).filter((b) => ids.has(b._id));
  }, [matchedRows, branches]);

  const classColors: Record<string, string> = {
    Fast: "bg-green-100 text-green-800",
    Mid: "bg-amber-100 text-amber-800",
    Slow: "bg-red-100 text-red-800",
  };

  if (rawRows === undefined) {
    return <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }

  if (matchedRows.length === 0) {
    return <p className="py-12 text-center text-muted-foreground">No products found for &quot;{query}&quot;</p>;
  }

  return (
    <div className="space-y-4">
      {/* View mode toggle */}
      <div className="flex items-center gap-3">
        <p className="text-sm text-muted-foreground">{matchedRows.length} results for &quot;{query}&quot;</p>
        <div className="ml-auto flex items-center gap-1.5 rounded-lg border bg-muted p-1">
          <button
            onClick={() => setViewMode("overall")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              viewMode === "overall"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Overall (All Branches)
          </button>
          {branchesWithResults.map((b) => (
            <button
              key={b._id}
              onClick={() => setViewMode(b._id)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === b._id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {b.code ?? b.name}
            </button>
          ))}
        </div>
      </div>

      {/* Overall view */}
      {viewMode === "overall" && (
        <PaginatedTable
          data={overallResults}
          pageSize={10}
          renderHeader={() => (
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-left font-medium">Product</th>
              <th className="px-3 py-2 text-left font-medium">Category</th>
              <th className="px-3 py-2 text-right font-medium">Branches</th>
              <th className="px-3 py-2 text-right font-medium">Total BEG</th>
              <th className="px-3 py-2 text-right font-medium">Total Sold</th>
              <th className="px-3 py-2 text-right font-medium">Total SOH</th>
              <th className="px-3 py-2 text-right font-medium">Sell-Thru</th>
              <th className="px-3 py-2 text-left font-medium">Class</th>
              <th className="px-3 py-2 text-left font-medium">WH Arrived</th>
              <th className="px-3 py-2 text-left font-medium">1st Branch</th>
            </tr>
          )}
          renderRow={(p) => (
            <tr key={p.styleCode} className="border-b last:border-0 hover:bg-muted/30">
              <td className="px-3 py-2">
                <div className="flex items-center gap-3">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.productName} className="h-10 w-10 rounded object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-xs font-medium text-muted-foreground">{p.styleCode.slice(-3)}</div>
                  )}
                  <div>
                    <div className="font-medium">{p.productName}</div>
                    <div className="text-xs text-muted-foreground">{p.styleCode}</div>
                  </div>
                </div>
              </td>
              <td className="px-3 py-2 text-muted-foreground">{p.category}</td>
              <td className="px-3 py-2 text-right">{p.branchCount}</td>
              <td className="px-3 py-2 text-right">{p.totalBeg}</td>
              <td className="px-3 py-2 text-right">{p.totalSold}</td>
              <td className="px-3 py-2 text-right">{p.totalSOH}</td>
              <td className="px-3 py-2 text-right font-bold">{p.sellThru.toFixed(1)}%</td>
              <td className="px-3 py-2"><Badge variant="secondary" className={classColors[p.classification]}>{p.classification}</Badge></td>
              <td className="px-3 py-2 text-sm text-muted-foreground">{p.warehouseArrivalDate ? new Date(p.warehouseArrivalDate).toLocaleDateString() : "—"}</td>
              <td className="px-3 py-2 text-sm text-muted-foreground">{p.earliestBranchArrival ? new Date(p.earliestBranchArrival).toLocaleDateString() : "—"}</td>
            </tr>
          )}
        />
      )}

      {/* Per-branch view */}
      {viewMode !== "overall" && (
        <PaginatedTable
          data={branchResults}
          pageSize={10}
          emptyMessage="No products at this branch match your search."
          renderHeader={() => (
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-left font-medium">Product</th>
              <th className="px-3 py-2 text-left font-medium">Category</th>
              <th className="px-3 py-2 text-right font-medium">BEG</th>
              <th className="px-3 py-2 text-right font-medium">Sold</th>
              <th className="px-3 py-2 text-right font-medium">SOH</th>
              <th className="px-3 py-2 text-right font-medium">Sell-Thru %</th>
              <th className="px-3 py-2 text-left font-medium">Class</th>
              <th className="px-3 py-2 text-right font-medium">Weeks</th>
              <th className="px-3 py-2 text-left font-medium">WH Arrived</th>
              <th className="px-3 py-2 text-left font-medium">Branch Arrived</th>
            </tr>
          )}
          renderRow={(r: Record<string, unknown>, i: number) => (
            <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
              <td className="px-3 py-2">
                <div className="flex items-center gap-3">
                  {r.imageUrl ? (
                    <img src={r.imageUrl as string} alt={r.productName as string} className="h-10 w-10 rounded object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-xs font-medium text-muted-foreground">{(r.styleCode as string).slice(-3)}</div>
                  )}
                  <div>
                    <div className="font-medium">{r.productName as string}</div>
                    <div className="text-xs text-muted-foreground">{r.styleCode as string}</div>
                  </div>
                </div>
              </td>
              <td className="px-3 py-2 text-muted-foreground">{r.category as string}</td>
              <td className="px-3 py-2 text-right">{r.beginningStock as number ?? "—"}</td>
              <td className="px-3 py-2 text-right">{r.sold as number ?? "—"}</td>
              <td className="px-3 py-2 text-right">{r.currentSOH as number ?? "—"}</td>
              <td className="px-3 py-2 text-right font-bold">{typeof r.sellThruPercent === "number" ? `${(r.sellThruPercent as number).toFixed(1)}%` : "—"}</td>
              <td className="px-3 py-2"><Badge variant="secondary" className={classColors[r.classification as string] ?? ""}>{r.classification as string}</Badge></td>
              <td className="px-3 py-2 text-right">{r.weeksOnFloor as number ?? "—"}</td>
              <td className="px-3 py-2 text-sm text-muted-foreground">{r.warehouseArrivalDate ? new Date(r.warehouseArrivalDate as string).toLocaleDateString() : "—"}</td>
              <td className="px-3 py-2 text-sm text-muted-foreground">{r.deliveryInStoreDate ? new Date(r.deliveryInStoreDate as string).toLocaleDateString() : "—"}</td>
            </tr>
          )}
        />
      )}
    </div>
  );
}
