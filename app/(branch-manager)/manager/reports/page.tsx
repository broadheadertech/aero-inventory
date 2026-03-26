import { SellThruSummaryClient } from "@/components/sell-thru/sell-thru-summary-client";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Sell-Thru Summary Report
        </h1>
        <p className="text-sm text-muted-foreground">
          Detailed product performance for your branch.
        </p>
      </div>
      <SellThruSummaryClient />
    </div>
  );
}
