"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge, type TransferRow } from "./transfer-table";
import { RejectDialog } from "./reject-dialog";
import { formatDate } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";

interface AdminTransferTableProps {
  transfers: TransferRow[];
}

export function AdminTransferTable({ transfers }: AdminTransferTableProps) {
  const [rejectTarget, setRejectTarget] = useState<Id<"transfers"> | null>(null);
  const [approvingId, setApprovingId] = useState<Id<"transfers"> | null>(null);

  const approveTransfer = useMutation(
    api.mutations.approveTransfer.approveTransfer
  );

  // Sort: pending first, then approved, then rejected; within each group newest first
  const statusOrder: Record<string, number> = { pending: 0, approved: 1, rejected: 2 };
  const sorted = [...transfers].sort((a, b) => {
    const statusDiff = (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
    if (statusDiff !== 0) return statusDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  async function handleApprove(transferId: Id<"transfers">) {
    setApprovingId(transferId);
    try {
      await approveTransfer({ transferId });
      toast.success("Transfer approved. Stock updated.");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to approve transfer.";
      toast.error(message);
    } finally {
      setApprovingId(null);
    }
  }

  if (transfers.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">No transfer requests yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>From Branch</TableHead>
              <TableHead>To Branch</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((transfer) => (
              <TableRow
                key={transfer._id}
                className={
                  transfer.status === "pending" ? "bg-yellow-50/50" : undefined
                }
              >
                <TableCell className="whitespace-nowrap text-sm">
                  {formatDate(transfer.createdAt)}
                </TableCell>
                <TableCell className="text-sm">{transfer.sourceBranchName}</TableCell>
                <TableCell className="text-sm">{transfer.destinationBranchName}</TableCell>
                <TableCell className="text-sm">
                  <ul className="space-y-0.5">
                    {transfer.items.map((item) => (
                      <li
                        key={`${transfer._id}-${item.productId}`}
                        className="text-xs"
                      >
                        <span className="font-mono font-medium">
                          {item.styleCode}
                        </span>{" "}
                        × {item.quantity}
                      </li>
                    ))}
                  </ul>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <StatusBadge status={transfer.status} />
                    {transfer.status === "rejected" && transfer.adminComment && (
                      <p className="text-xs text-muted-foreground max-w-[200px]">
                        {transfer.adminComment}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {transfer.status === "pending" ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        disabled={approvingId === transfer._id}
                        onClick={() => handleApprove(transfer._id)}
                      >
                        {approvingId === transfer._id ? "Approving..." : "Approve"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={approvingId === transfer._id}
                        onClick={() => setRejectTarget(transfer._id)}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <RejectDialog
        transferId={rejectTarget}
        open={rejectTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRejectTarget(null);
        }}
      />
    </>
  );
}
