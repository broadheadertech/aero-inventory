import { StockOverviewStaff } from "@/components/branches/stock-overview-staff";
import { Package } from "lucide-react";

export default function StaffStockOverviewPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Package className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Stock Overview</h1>
          <p className="text-xs text-muted-foreground">Current stock on hand</p>
        </div>
      </div>
      <StockOverviewStaff />
    </div>
  );
}
