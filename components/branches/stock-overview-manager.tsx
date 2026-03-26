"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { X } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";

type BranchProductWithProduct = Doc<"branchProducts"> & {
  product: Doc<"products"> | null;
};

export function StockOverviewManager() {
  const branchProducts = useQuery(
    api.queries.listMyBranchProducts.listMyBranchProducts
  );

  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterCollection, setFilterCollection] = useState("");

  // Loading state — Convex useQuery returns undefined while loading
  if (branchProducts === undefined) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  // Derive unique filter options from loaded data
  const departments = Array.from(
    new Set(
      (branchProducts as BranchProductWithProduct[])
        .map((bp) => bp.product?.department)
        .filter((d): d is string => !!d)
    )
  ).sort();

  const categories = Array.from(
    new Set(
      (branchProducts as BranchProductWithProduct[])
        .map((bp) => bp.product?.category)
        .filter((c): c is string => !!c)
    )
  ).sort();

  const collections = Array.from(
    new Set(
      (branchProducts as BranchProductWithProduct[])
        .map((bp) => bp.product?.collection)
        .filter((c): c is string => !!c)
    )
  ).sort();

  // Client-side filtering
  const filtered = (branchProducts as BranchProductWithProduct[]).filter(
    (bp) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        (bp.product?.styleCode.toLowerCase().includes(q) ?? false) ||
        (bp.product?.name.toLowerCase().includes(q) ?? false);
      const matchesDept =
        !filterDept || bp.product?.department === filterDept;
      const matchesCat =
        !filterCat || bp.product?.category === filterCat;
      const matchesCollection =
        !filterCollection || bp.product?.collection === filterCollection;
      return matchesSearch && matchesDept && matchesCat && matchesCollection;
    }
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Search and filter controls */}
      <div className="flex flex-wrap gap-3">
        <Input
          type="search"
          placeholder="Search by style code or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-12 min-w-[200px] flex-1"
          aria-label="Search products"
        />
        <Select value={filterDept || "all"} onValueChange={(val) => setFilterDept(val === "all" || !val ? "" : val)}>
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
        <Select value={filterCat || "all"} onValueChange={(val) => setFilterCat(val === "all" || !val ? "" : val)}>
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
        <Select value={filterCollection || "all"} onValueChange={(val) => setFilterCollection(val === "all" || !val ? "" : val)}>
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
      {(filterDept || filterCat || filterCollection) && (
        <div className="flex flex-wrap gap-2">
          {filterDept && (
            <button
              onClick={() => setFilterDept("")}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium"
            >
              Dept: {filterDept}
              <X className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">Remove department filter</span>
            </button>
          )}
          {filterCat && (
            <button
              onClick={() => setFilterCat("")}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium"
            >
              Cat: {filterCat}
              <X className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">Remove category filter</span>
            </button>
          )}
          {filterCollection && (
            <button
              onClick={() => setFilterCollection("")}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium"
            >
              Collection: {filterCollection}
              <X className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">Remove collection filter</span>
            </button>
          )}
          <button
            onClick={() => {
              setFilterDept("");
              setFilterCat("");
              setFilterCollection("");
            }}
            className="text-xs text-muted-foreground underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No products match your current filters.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">BEG</TableHead>
                <TableHead className="text-right">SOLD</TableHead>
                <TableHead className="text-right">SOH</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((bp) => {
                const sold = bp.beginningStock - bp.currentSOH;
                return (
                  <TableRow key={bp._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {bp.product?.imageUrl ? (
                          <img src={bp.product.imageUrl} alt="" className="h-8 w-8 rounded object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-[10px] font-medium text-muted-foreground">
                            {(bp.product?.styleCode ?? "").slice(-3)}
                          </div>
                        )}
                        <div>
                          <div className="font-mono text-sm font-medium">{bp.product?.styleCode ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{bp.product?.name ?? "—"}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {bp.product?.department ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {bp.beginningStock}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {sold}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {bp.currentSOH}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
