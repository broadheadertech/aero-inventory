"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { TransferRequestForm } from "@/components/transfers/transfer-request-form";
import { TransferTable, type TransferRow } from "@/components/transfers/transfer-table";

export default function ManagerTransfersPage() {
  const [sheetOpen, setSheetOpen] = useState(false);

  // M2 fix: listTransfers now returns { transfers, myBranchId } — no separate branchProducts query needed
  const data = useQuery(api.queries.listTransfers.listTransfers) as
    | { transfers: TransferRow[]; myBranchId: string | null }
    | undefined;

  const isLoading = data === undefined;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transfers</h1>
          <p className="text-sm text-muted-foreground">
            Request and track interbranch stock transfers
          </p>
        </div>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger render={<Button />}>
            New Transfer Request
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>New Transfer Request</SheetTitle>
            </SheetHeader>
            <TransferRequestForm onSuccess={() => setSheetOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Transfer list */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <TransferTable
          transfers={data.transfers}
          userBranchId={data.myBranchId as TransferRow["sourceBranchId"] | null}
        />
      )}
    </div>
  );
}
