import { NetworkSummaryClient } from "@/components/sell-thru/network-summary-client";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Network Reports
        </h1>
        <p className="text-sm text-muted-foreground">
          Sell-through performance across all branches.
        </p>
      </div>
      <NetworkSummaryClient />
    </div>
  );
}
