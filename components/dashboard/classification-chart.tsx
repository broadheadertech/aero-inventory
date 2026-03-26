"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ClassificationChart() {
  const stats = useQuery(api.queries.dashboardStats.dashboardStats, {});

  if (stats === undefined) return <Skeleton className="h-64" />;

  const total = stats.fastCount + stats.midCount + stats.slowCount;
  const data = [
    { label: "Fast", count: stats.fastCount, color: "#16a34a", percent: total > 0 ? (stats.fastCount / total) * 100 : 0 },
    { label: "Mid", count: stats.midCount, color: "#d97706", percent: total > 0 ? (stats.midCount / total) * 100 : 0 },
    { label: "Slow", count: stats.slowCount, color: "#dc2626", percent: total > 0 ? (stats.slowCount / total) * 100 : 0 },
  ];

  // Simple CSS donut chart
  const segments = data.reduce<Array<{ offset: number; percent: number; color: string }>>((acc, d) => {
    const offset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].percent : 0;
    acc.push({ offset, percent: d.percent, color: d.color });
    return acc;
  }, []);

  const gradient = segments
    .map((s) => `${s.color} ${s.offset}% ${s.offset + s.percent}%`)
    .join(", ");

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Classification Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Donut */}
          <div
            className="relative h-32 w-32 shrink-0 rounded-full"
            style={{
              background: total > 0
                ? `conic-gradient(${gradient})`
                : "#e5e7eb",
            }}
          >
            <div className="absolute inset-3 flex items-center justify-center rounded-full bg-card">
              <div className="text-center">
                <p className="text-xl font-bold">{total}</p>
                <p className="text-[10px] text-muted-foreground">Total</p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-3">
            {data.map((d) => (
              <div key={d.label} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                <div>
                  <p className="text-sm font-medium">{d.label}</p>
                  <p className="text-xs text-muted-foreground">{d.count} ({d.percent.toFixed(0)}%)</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
