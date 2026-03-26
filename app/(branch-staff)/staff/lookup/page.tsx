"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScanSearch, Search, Package } from "lucide-react";

const classColors: Record<string, string> = {
  Fast: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Mid: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  Slow: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function ProductLookupPage() {
  const [search, setSearch] = useState("");
  const branchProducts = useQuery(api.queries.getStaffBranchProducts.getStaffBranchProducts);

  const results = useMemo(() => {
    if (!branchProducts || !search || search.length < 2) return [];
    const q = search.toLowerCase();
    return branchProducts.filter(
      (p: Record<string, unknown>) =>
        (p.productName as string)?.toLowerCase().includes(q) ||
        (p.styleCode as string)?.toLowerCase().includes(q)
    );
  }, [branchProducts, search]);

  const selectedProduct = results.length === 1 ? results[0] : null;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <ScanSearch className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Product Lookup</h1>
          <p className="text-xs text-muted-foreground">Search by name or style code</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search product or style code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 text-base"
          autoFocus
        />
      </div>

      {branchProducts === undefined && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
      )}

      {/* Empty state */}
      {search.length > 0 && search.length < 2 && (
        <p className="py-8 text-center text-sm text-muted-foreground">Type at least 2 characters to search</p>
      )}
      {search.length >= 2 && results.length === 0 && branchProducts !== undefined && (
        <p className="py-8 text-center text-sm text-muted-foreground">No products found for &ldquo;{search}&rdquo;</p>
      )}

      {/* Results list */}
      {!selectedProduct && results.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{results.length} result{results.length !== 1 ? "s" : ""}</p>
          {results.map((p: Record<string, unknown>) => {
            const beg = (p.beginningStock as number) ?? 0;
            const soh = (p.currentSOH as number) ?? 0;
            const sold = beg - soh;
            const sellThru = beg > 0 ? (sold / beg) * 100 : 0;
            const classification = sellThru >= 60 ? "Fast" : sellThru >= 30 ? "Mid" : "Slow";

            return (
              <button
                key={p.branchProductId as string}
                onClick={() => setSearch(p.styleCode as string)}
                className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 active:bg-muted"
              >
                {p.imageUrl ? (
                  <img src={p.imageUrl as string} alt="" className="h-12 w-12 rounded-md object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{p.productName as string}</div>
                  <div className="text-xs text-muted-foreground">{p.styleCode as string}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold">{soh} pcs</div>
                  <Badge variant="secondary" className={`text-[10px] ${classColors[classification]}`}>{classification}</Badge>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Product detail card */}
      {selectedProduct && (() => {
        const p = selectedProduct as Record<string, unknown>;
        const beg = (p.beginningStock as number) ?? 0;
        const soh = (p.currentSOH as number) ?? 0;
        const sold = beg - soh;
        const sellThru = beg > 0 ? (sold / beg) * 100 : 0;
        const classification = sellThru >= 60 ? "Fast" : sellThru >= 30 ? "Mid" : "Slow";
        const retailPrice = (p.retailPrice as number) ?? 0;

        return (
          <div className="space-y-4">
            {/* Product header */}
            <div className="flex gap-4 rounded-lg border p-4">
              {p.imageUrl ? (
                <img src={p.imageUrl as string} alt="" className="h-20 w-20 rounded-lg object-cover" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-muted">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-base font-bold">{p.productName as string}</h2>
                <p className="text-sm text-muted-foreground">{p.styleCode as string}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="secondary" className={classColors[classification]}>{classification}</Badge>
                  <span className="text-xs text-muted-foreground">{p.category as string}</span>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="rounded-lg border p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Retail Price</p>
              <p className="text-2xl font-bold">
                {"\u20B1"}{(retailPrice / 100).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* Stock stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">BEG</p>
                <p className="text-xl font-bold">{beg}</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Sold</p>
                <p className="text-xl font-bold">{sold}</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">SOH</p>
                <p className="text-xl font-bold">{soh}</p>
              </div>
            </div>

            {/* Sell-thru bar */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Sell-Thru</p>
                <p className="text-lg font-bold">{sellThru.toFixed(1)}%</p>
              </div>
              <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${
                    sellThru >= 60 ? "bg-green-500" : sellThru >= 30 ? "bg-amber-500" : "bg-red-500"
                  }`}
                  style={{ width: `${Math.min(sellThru, 100)}%` }}
                />
              </div>
            </div>

            {/* Details */}
            <div className="rounded-lg border divide-y">
              {[
                ["Department", p.department as string],
                ["Category", p.category as string],
                ["Collection", p.collection as string],
                ["Color", p.color as string],
                ["Fabric", (p.fabric as string) ?? "—"],
                ["Arrived in Branch", p.deliveryInStoreDate ? new Date(p.deliveryInStoreDate as string).toLocaleDateString() : "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
