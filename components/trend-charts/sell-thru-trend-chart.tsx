"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { TrendDataPoint } from "@/convex/helpers/trendCalculation";
import { formatDateLabel } from "@/components/trend-charts/chart-utils";

type SellThruTrendChartProps = {
  data: TrendDataPoint[] | undefined;
};

export function SellThruTrendChart({ data }: SellThruTrendChartProps) {
  if (data === undefined) {
    return <Skeleton className="h-[350px] w-full" />;
  }

  if (data.length === 0) {
    return (
      <div className="flex h-[350px] items-center justify-center rounded-md border">
        <p className="text-sm text-muted-foreground">
          No trend data available for the selected filters.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDateLabel}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={{ stroke: "#d1d5db" }}
            tickLine={{ stroke: "#d1d5db" }}
          />
          <YAxis
            tickFormatter={(value: number) => `${value}%`}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={{ stroke: "#d1d5db" }}
            tickLine={{ stroke: "#d1d5db" }}
            domain={[0, 100]}
          />
          <Tooltip
            formatter={(value: number) => [`${value}%`, "Sell-Thru"]}
            labelFormatter={formatDateLabel}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid hsl(var(--border))",
              backgroundColor: "hsl(var(--background))",
            }}
          />
          <Line
            type="monotone"
            dataKey="sellThruPercent"
            stroke="#2563eb"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#2563eb", strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 6, fill: "#2563eb", strokeWidth: 2, stroke: "#fff" }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
