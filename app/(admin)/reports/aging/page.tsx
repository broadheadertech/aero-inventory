import { AgingSummaryClient } from "@/components/aging-summary/aging-summary-client";

export default function AgingReportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Aging Summary Report</h1>
        <p className="text-sm text-muted-foreground">
          Products grouped by aging bracket across the network.
        </p>
      </div>
      <AgingSummaryClient />
    </div>
  );
}
