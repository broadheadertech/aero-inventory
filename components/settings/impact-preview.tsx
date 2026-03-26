"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { ThresholdFormValues } from "@/lib/validations/threshold-form";
import { ClassificationBadge } from "@/components/sell-thru/classification-badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ImpactRow {
  styleCode: string;
  productName: string;
  branchName: string;
  period: string;
  currentClassification: "Fast" | "Mid" | "Slow";
  newClassification: "Fast" | "Mid" | "Slow";
}

interface ImpactResult {
  totalAffected: number;
  branchCount: number;
  rows: ImpactRow[];
}

interface ImpactPreviewProps {
  pendingValues: ThresholdFormValues;
  onImpactChange?: (totalAffected: number, branchCount: number) => void;
}

export function ImpactPreview({ pendingValues, onImpactChange }: ImpactPreviewProps) {
  const [debounced, setDebounced] = useState(pendingValues);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(pendingValues), 500);
    return () => clearTimeout(t);
  }, [pendingValues]);

  const pendingThresholds = {
    daily: { fast: debounced.daily.fast, slow: debounced.daily.slow },
    weekly: { fast: debounced.weekly.fast, slow: debounced.weekly.slow },
    monthly: { fast: debounced.monthly.fast, slow: debounced.monthly.slow },
    quarterly: {
      fast: debounced.quarterly.fast,
      slow: debounced.quarterly.slow,
    },
  };

  const impact = useQuery(
    api.queries.getThresholdImpact.getThresholdImpact,
    { pendingThresholds }
  ) as ImpactResult | undefined;

  useEffect(() => {
    if (impact !== undefined) {
      onImpactChange?.(impact.totalAffected, impact.branchCount);
    }
  }, [impact, onImpactChange]);

  if (impact === undefined) {
    return <Skeleton className="h-12 w-full rounded-lg" />;
  }

  if (impact.totalAffected === 0) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
        No products affected by this change
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm font-medium text-amber-800 dark:text-amber-200">
        {impact.totalAffected} product{impact.totalAffected !== 1 ? "s" : ""}{" "}
        affected across {impact.branchCount} branch
        {impact.branchCount !== 1 ? "es" : ""}
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <caption className="sr-only">
            Products affected by threshold change
          </caption>
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                Style Code
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                Branch
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                Period
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                Current
              </th>
              <th className="px-3 py-2 text-muted-foreground" />
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                New
              </th>
            </tr>
          </thead>
          <tbody>
            {impact.rows.map((row) => (
              <tr key={`${row.styleCode}-${row.branchName}-${row.period}`} className="border-b last:border-0 hover:bg-muted/50">
                <td className="px-3 py-2 font-mono text-xs">
                  {row.styleCode}
                </td>
                <td className="px-3 py-2 max-w-[120px] truncate">
                  {row.branchName}
                </td>
                <td className="px-3 py-2 capitalize text-xs text-muted-foreground">
                  {row.period}
                </td>
                <td className="px-3 py-2">
                  <ClassificationBadge
                    classification={row.currentClassification}
                  />
                </td>
                <td className="px-3 py-2 text-center text-muted-foreground">
                  →
                </td>
                <td className="px-3 py-2">
                  <ClassificationBadge
                    classification={row.newClassification}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
