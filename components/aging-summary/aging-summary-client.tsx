"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { AgingSummaryTable } from "./aging-summary-table";
import { ExportExcelButton } from "@/components/export/export-excel-button";
import { ExportPdfButton } from "@/components/export/export-pdf-button";
import type { ReportExportConfig } from "@/lib/types/export";
import type { AgingBracketRow } from "@/lib/types/aging-summary";

const SELECT_CLASS =
  "rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring";

export function AgingSummaryClient() {
  const [timePeriod, setTimePeriod] = useState("weekly");
  const [branchId, setBranchId] = useState("");
  const [expandedRemark, setExpandedRemark] = useState<string | null>(null);

  type BranchOption = { _id: string; name: string; type?: string };
  const branches = useQuery(api.queries.listActiveBranches.listActiveBranches) as BranchOption[] | undefined;
  const rawRows = useQuery(api.queries.getAgingSummary.getAgingSummary, {
    timePeriod: timePeriod || undefined,
    branchId: branchId ? (branchId as Id<"branches">) : undefined,
  });
  const rows = rawRows as AgingBracketRow[] | undefined;

  const handleToggle = (remark: string) => {
    setExpandedRemark((prev) => (prev === remark ? null : remark));
  };

  const getExportConfig = (): ReportExportConfig => {
    // Flatten bracket data: each product row includes the aging remark
    const flatRows: Record<string, unknown>[] = [];
    for (const bracket of rows ?? []) {
      for (const p of bracket.products) {
        flatRows.push({
          remark: bracket.remark,
          styleCode: p.styleCode,
          branchName: p.branchName,
          weeksOnFloor: p.weeksOnFloor,
          sellThruPercent: p.sellThruPercent,
          currentSOH: p.currentSOH,
        });
      }
    }
    const branchLabel = branches
      ?.find((b) => b._id === branchId)?.name;
    return {
      reportName: "Aging Summary Report",
      columns: [
        { header: "Aging Remark", key: "remark", type: "string" },
        { header: "Style Code", key: "styleCode", type: "string" },
        { header: "Branch", key: "branchName", type: "string" },
        { header: "Weeks on Floor", key: "weeksOnFloor", type: "number" },
        { header: "Sell-Thru %", key: "sellThruPercent", type: "percent" },
        { header: "SOH", key: "currentSOH", type: "number" },
      ],
      rows: flatRows,
      filters: {
        ...(branchLabel ? { Branch: branchLabel } : {}),
      },
      timePeriod,
    };
  };

  if (rows === undefined) {
    return (
      <div className="flex flex-col gap-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Time Period */}
        <select
          value={timePeriod}
          onChange={(e) => setTimePeriod(e.target.value)}
          className={SELECT_CLASS}
          aria-label="Time period"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
        </select>

        {/* Branch filter */}
        <select
          value={branchId}
          onChange={(e) => {
            setBranchId(e.target.value);
            setExpandedRemark(null);
          }}
          className={SELECT_CLASS}
          aria-label="Filter by branch"
        >
          <option value="">All Branches</option>
          {(branches ?? [])
            .filter((b) => b.type !== "warehouse")
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
        </select>

        <ExportExcelButton getConfig={getExportConfig} />
        <ExportPdfButton getConfig={getExportConfig} />
      </div>

      <AgingSummaryTable
        rows={rows}
        expandedRemark={expandedRemark}
        onToggle={handleToggle}
      />
    </div>
  );
}
