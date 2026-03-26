import { AdminNetworkDashboard } from "@/components/sell-thru/admin-network-dashboard";
import { UpcomingEventsWidget } from "@/components/trading-calendar/upcoming-events-widget";
import { NetworkSnapshotCards } from "@/components/dashboard/network-snapshot-cards";
import { ClassificationChart } from "@/components/dashboard/classification-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Network Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Sell-through performance across all branches
        </p>
      </div>
      <NetworkSnapshotCards />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UpcomingEventsWidget />
        </div>
        <ClassificationChart />
      </div>
      <AdminNetworkDashboard />
      <RecentActivity />
    </div>
  );
}
