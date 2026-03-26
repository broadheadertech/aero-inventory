import { ManagerDashboard } from "@/components/sell-thru/manager-dashboard";

export default function ManagerDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sell-Thru Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Monitor your branch&apos;s sell-through performance
        </p>
      </div>
      <ManagerDashboard />
    </div>
  );
}
