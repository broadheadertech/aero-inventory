import { StockOverviewManager } from "@/components/branches/stock-overview-manager";

export default function ManagerStockOverviewPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Stock Overview</h1>
        <p className="text-sm text-muted-foreground">
          Monitor inventory levels for your branch
        </p>
      </div>
      <StockOverviewManager />
    </div>
  );
}
