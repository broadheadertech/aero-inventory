"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useStockOverviewStore } from "@/lib/stores/use-stock-overview-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import type { StockRow } from "@/lib/types/stock-overview";

export function StockOverviewFilterBar() {
  const rows = useQuery(api.queries.listAllBranchProducts.listAllBranchProducts);

  const {
    searchQuery,
    branchFilter,
    departmentFilter,
    categoryFilter,
    collectionFilter,
    setSearchQuery,
    setBranchFilter,
    setDepartmentFilter,
    setCategoryFilter,
    setCollectionFilter,
    clearAllFilters,
  } = useStockOverviewStore();

  const branches = useMemo(() => {
    if (!rows) return [];
    const map = new Map<string, string>();
    (rows as StockRow[]).forEach((r) => {
      if (r.branch) map.set(r.branchId, r.branch.name);
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [rows]);

  const departments = useMemo(
    () =>
      [
        ...new Set(
          (rows as StockRow[] ?? [])
            .map((r) => r.product?.department)
            .filter((d): d is string => !!d)
        ),
      ].sort(),
    [rows]
  );

  const categories = useMemo(
    () =>
      [
        ...new Set(
          (rows as StockRow[] ?? [])
            .map((r) => r.product?.category)
            .filter((c): c is string => !!c)
        ),
      ].sort(),
    [rows]
  );

  const collections = useMemo(
    () =>
      [
        ...new Set(
          (rows as StockRow[] ?? [])
            .map((r) => r.product?.collection)
            .filter((c): c is string => !!c)
        ),
      ].sort(),
    [rows]
  );

  const hasActiveFilters =
    !!searchQuery ||
    !!branchFilter ||
    !!departmentFilter ||
    !!categoryFilter ||
    !!collectionFilter;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <Input
          type="search"
          placeholder="Search by style code or name..."
          className="h-10 min-w-[200px] flex-1"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search products"
        />

        {/* Branch filter */}
        <Select value={branchFilter || "all"} onValueChange={(val) => setBranchFilter(val === "all" || !val ? "" : val)}>
          <SelectTrigger className="h-10 w-[180px]">
            <SelectValue placeholder="All Branches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {branches.map(([id, name]) => (
              <SelectItem key={id} value={id}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Department filter */}
        <Select value={departmentFilter || "all"} onValueChange={(val) => setDepartmentFilter(val === "all" || !val ? "" : val)}>
          <SelectTrigger className="h-10 w-[160px]">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category filter */}
        <Select value={categoryFilter || "all"} onValueChange={(val) => setCategoryFilter(val === "all" || !val ? "" : val)}>
          <SelectTrigger className="h-10 w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Collection filter */}
        <Select value={collectionFilter || "all"} onValueChange={(val) => setCollectionFilter(val === "all" || !val ? "" : val)}>
          <SelectTrigger className="h-10 w-[160px]">
            <SelectValue placeholder="Collection" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Collections</SelectItem>
            {collections.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium"
            >
              Search: {searchQuery}
              <X className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">Remove search filter</span>
            </button>
          )}
          {branchFilter && (
            <button
              onClick={() => setBranchFilter("")}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium"
            >
              Branch: {branches.find(([id]) => id === branchFilter)?.[1] ?? branchFilter}
              <X className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">Remove branch filter</span>
            </button>
          )}
          {departmentFilter && (
            <button
              onClick={() => setDepartmentFilter("")}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium"
            >
              Dept: {departmentFilter}
              <X className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">Remove department filter</span>
            </button>
          )}
          {categoryFilter && (
            <button
              onClick={() => setCategoryFilter("")}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium"
            >
              Cat: {categoryFilter}
              <X className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">Remove category filter</span>
            </button>
          )}
          {collectionFilter && (
            <button
              onClick={() => setCollectionFilter("")}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium"
            >
              Collection: {collectionFilter}
              <X className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">Remove collection filter</span>
            </button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs text-muted-foreground"
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
