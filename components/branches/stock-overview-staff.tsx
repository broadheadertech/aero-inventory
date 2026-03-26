"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Doc } from "@/convex/_generated/dataModel";

type BranchProductWithProduct = Doc<"branchProducts"> & {
  product: Doc<"products"> | null;
};

export function StockOverviewStaff() {
  const branchProducts = useQuery(
    api.queries.listMyBranchProducts.listMyBranchProducts
  );

  const [search, setSearch] = useState("");

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

  // Client-side search filtering
  const filtered = (branchProducts as BranchProductWithProduct[]).filter(
    (bp) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        (bp.product?.styleCode.toLowerCase().includes(q) ?? false) ||
        (bp.product?.name.toLowerCase().includes(q) ?? false);
      return matchesSearch;
    }
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Search control */}
      <Input
        type="search"
        placeholder="Search by style code or name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-12"
        aria-label="Search products"
      />

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
