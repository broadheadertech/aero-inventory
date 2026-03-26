"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";

export type TransferStatus = "pending" | "approved" | "rejected";

export interface TransferItem {
  productId: Id<"products">;
  styleCode: string;
  productName: string;
  productImageUrl?: string | null;
  quantity: number;
}

// Exported so page can use it for type-safe casting of query results
export interface TransferRow {
  _id: Id<"transfers">;
  sourceBranchId: Id<"branches">;
  destinationBranchId: Id<"branches">;
  sourceBranchName: string;
  destinationBranchName: string;
  status: TransferStatus;
  adminComment?: string;
  createdAt: string;
  items: TransferItem[];
}

interface TransferTableProps {
  transfers: TransferRow[];
  userBranchId: Id<"branches"> | null | undefined;
}

export function StatusBadge({ status }: { status: TransferStatus }) {
  const variants: Record<
    TransferStatus,
    { label: string; className: string }
  > = {
    pending: {
      label: "Pending",
      className: "bg-yellow-100 text-yellow-800 border-yellow-300",
    },
    approved: {
      label: "Approved",
      className: "bg-green-100 text-green-800 border-green-300",
    },
    rejected: {
      label: "Rejected",
      className: "bg-red-100 text-red-800 border-red-300",
    },
  };
  const { label, className } = variants[status];
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}


export function TransferTable({ transfers, userBranchId }: TransferTableProps) {
  const [search, setSearch] = useState("");

  if (transfers.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No transfer requests yet.
        </p>
      </div>
    );
  }

  const filtered = transfers.filter((transfer) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      transfer.sourceBranchName?.toLowerCase().includes(q) ||
      transfer.destinationBranchName?.toLowerCase().includes(q) ||
      transfer.items.some(
        (item) =>
          item.styleCode?.toLowerCase().includes(q) ||
          item.productName?.toLowerCase().includes(q)
      )
    );
  });

  return (
    <div className="space-y-4">
    <div className="relative max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search by style code or name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="pl-9"
      />
    </div>
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Direction</TableHead>
            <TableHead>Other Branch</TableHead>
            <TableHead>Products</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((transfer) => {
            const knownBranch = userBranchId != null;
            const isOutgoing =
              knownBranch && transfer.sourceBranchId === userBranchId;
            const direction = !knownBranch
              ? "—"
              : isOutgoing
                ? "Outgoing"
                : "Incoming";
            // Show "—" when direction is unknown to avoid displaying incorrect branch name
            const otherBranch = !knownBranch
              ? "—"
              : isOutgoing
                ? transfer.destinationBranchName
                : transfer.sourceBranchName;

            return (
              <TableRow key={transfer._id}>
                <TableCell className="whitespace-nowrap text-sm">
                  {formatDate(transfer.createdAt)}
                </TableCell>
                <TableCell>
                  <span
                    className={`text-xs font-medium ${
                      direction === "Outgoing"
                        ? "text-orange-600"
                        : direction === "Incoming"
                          ? "text-blue-600"
                          : "text-muted-foreground"
                    }`}
                  >
                    {direction}
                  </span>
                </TableCell>
                <TableCell className="text-sm">{otherBranch}</TableCell>
                <TableCell className="text-sm">
                  <ul className="space-y-1">
                    {transfer.items.map((item) => (
                      <li
                        key={`${transfer._id}-${item.productId}`}
                        className="flex items-center gap-2 text-xs"
                      >
                        {item.productImageUrl ? (
                          <img src={item.productImageUrl} alt="" className="h-8 w-8 rounded object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-[10px] font-medium text-muted-foreground">
                            {item.styleCode.slice(-3)}
                          </div>
                        )}
                        <span>
                          <span className="font-mono font-medium">
                            {item.styleCode}
                          </span>
                          <span className="text-muted-foreground"> — {item.productName}</span>
                          <span className="ml-1 font-semibold">× {item.quantity}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <StatusBadge status={transfer.status} />
                    {transfer.status === "rejected" &&
                      transfer.adminComment && (
                        <p className="text-xs text-muted-foreground max-w-[200px]">
                          {transfer.adminComment}
                        </p>
                      )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
    </div>
  );
}
