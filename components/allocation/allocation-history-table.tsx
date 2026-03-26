"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

export function AllocationHistoryTable() {
  const history = useQuery(api.queries.listAllocationHistory.listAllocationHistory, {});

  if (history === undefined) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-md border py-12">
        <p className="text-sm text-muted-foreground">No allocation history yet.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Product</TableHead>
          <TableHead className="text-right">Total Qty</TableHead>
          <TableHead className="text-right">Branches</TableHead>
          <TableHead>Algorithm</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {history.map((h) => (
          <TableRow key={h._id}>
            <TableCell>{formatDate(h.createdAt)}</TableCell>
            <TableCell className="font-medium">
              {h.styleCode} — {h.productName}
            </TableCell>
            <TableCell className="text-right">{h.totalQuantity}</TableCell>
            <TableCell className="text-right">{h.branchCount}</TableCell>
            <TableCell>
              <Badge variant="outline" className="text-xs">
                {h.algorithmVersion}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
