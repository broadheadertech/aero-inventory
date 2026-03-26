"use client";

import { PnLDashboard } from "@/components/pnl/pnl-dashboard";
import { MarginErosionTable } from "@/components/pnl/margin-erosion-table";

export default function PnLPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Network P&L</h1>
        <p className="text-muted-foreground">
          Revenue, cost, and margin performance across the network
        </p>
      </div>
      <PnLDashboard />
      <div className="space-y-3 border-t pt-6">
        <div>
          <h2 className="text-lg font-semibold">Margin Erosion</h2>
          <p className="text-sm text-muted-foreground">
            Products where current selling price has dropped from original SRP
          </p>
        </div>
        <MarginErosionTable />
      </div>
    </div>
  );
}
