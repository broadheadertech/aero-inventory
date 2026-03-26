"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminTransferTable } from "@/components/transfers/admin-transfer-table";
import type { TransferRow, TransferStatus } from "@/components/transfers/transfer-table";
import type { Id } from "@/convex/_generated/dataModel";

type Branch = { _id: Id<"branches">; name: string };

export default function AdminTransfersPage() {
  const data = useQuery(api.queries.listTransfers.listTransfers) as
    | { transfers: TransferRow[]; myBranchId: null }
    | undefined;

  const branches = useQuery(
    api.queries.listActiveBranches.listActiveBranches
  ) as Branch[] | undefined;

  const [statusFilter, setStatusFilter] = useState<"all" | TransferStatus>("all");
  const [branchFilter, setBranchFilter] = useState<string>("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const isLoading = data === undefined;
  const transfers = data?.transfers ?? [];
  const pendingCount = transfers.filter((t) => t.status === "pending").length;

  const hasActiveFilters =
    statusFilter !== "all" || branchFilter !== "" || fromDate !== "" || toDate !== "";

  const filtered = transfers.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (
      branchFilter !== "" &&
      t.sourceBranchId !== branchFilter &&
      t.destinationBranchId !== branchFilter
    )
      return false;
    if (fromDate && t.createdAt.slice(0, 10) < fromDate) return false;
    if (toDate && t.createdAt.slice(0, 10) > toDate) return false;
    return true;
  });

  function clearFilters() {
    setStatusFilter("all");
    setBranchFilter("");
    setFromDate("");
    setToDate("");
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transfers</h1>
          <p className="text-sm text-muted-foreground">
            Review and approve interbranch transfer requests
          </p>
        </div>
        {!isLoading && pendingCount > 0 && (
          <Badge variant="destructive" className="text-sm">
            {pendingCount} pending
          </Badge>
        )}
      </div>

      {/* Filter bar */}
      {!isLoading && (
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <Select
            value={statusFilter}
            onValueChange={(val) =>
              setStatusFilter((val ?? "all") as "all" | TransferStatus)
            }
          >
            <SelectTrigger className="h-9 w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          {/* Branch filter */}
          <Select
            value={branchFilter || "all"}
            onValueChange={(val) =>
              setBranchFilter(val === "all" || !val ? "" : val)
            }
          >
            <SelectTrigger className="h-9 w-50">
              <SelectValue placeholder="All branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All branches</SelectItem>
              {(branches ?? []).map((b) => (
                <SelectItem key={b._id} value={b._id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* From date */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">From</span>
            <Input
              type="date"
              className="h-9 w-40"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              aria-label="From date"
            />
          </div>

          {/* To date */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">To</span>
            <Input
              type="date"
              className="h-9 w-40"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              aria-label="To date"
            />
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs text-muted-foreground"
            >
              Clear filters
            </Button>
          )}
        </div>
      )}

      {/* Transfer list */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-9 w-full max-w-160" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : filtered.length === 0 && transfers.length > 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No transfers match the current filters.
          </p>
        </div>
      ) : (
        <AdminTransferTable transfers={filtered} />
      )}
    </div>
  );
}
