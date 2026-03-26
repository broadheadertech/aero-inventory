import { AdminStockOverviewTable } from "@/components/stock-overview/admin-stock-overview-table";
import { StockOverviewFilterBar } from "@/components/stock-overview/stock-overview-filter-bar";

export default function AdminStockOverviewPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold tracking-tight">Stock Overview</h1>
      <StockOverviewFilterBar />
      <AdminStockOverviewTable />
    </div>
  );
}
