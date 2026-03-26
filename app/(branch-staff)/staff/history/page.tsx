"use client";

import { SalesHistoryList } from "@/components/sales-entry/sales-history-list";
import { ClipboardList } from "lucide-react";

export default function StaffHistoryPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <ClipboardList className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Sales History</h1>
          <p className="text-xs text-muted-foreground">Your recent sales entries</p>
        </div>
      </div>
      <SalesHistoryList />
    </div>
  );
}
