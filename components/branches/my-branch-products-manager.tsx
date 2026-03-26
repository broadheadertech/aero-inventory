"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
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

export function MyBranchProductsManager() {
  const branchProducts = useQuery(
    api.queries.listMyBranchProducts.listMyBranchProducts
  );

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

  // Empty state
  if (branchProducts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No products assigned to your branch yet.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Style Code</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">BEG</TableHead>
          <TableHead className="text-right">SOH</TableHead>
          <TableHead>Delivery Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(branchProducts as BranchProductWithProduct[]).map((bp) => (
          <TableRow key={bp._id}>
            <TableCell className="font-mono text-sm font-medium">
              {bp.product?.styleCode ?? "—"}
            </TableCell>
            <TableCell className="text-sm">
              {bp.product?.name ?? "—"}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {bp.beginningStock}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {bp.currentSOH}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {bp.deliveryInStoreDate
                ? new Intl.DateTimeFormat("en-PH", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }).format(new Date(bp.deliveryInStoreDate))
                : "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
