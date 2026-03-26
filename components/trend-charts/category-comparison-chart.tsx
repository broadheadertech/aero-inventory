"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { TrendDataPoint } from "@/convex/helpers/trendCalculation";
import { formatDateLabel } from "@/components/trend-charts/chart-utils";

type ComparisonChartProps = {
  productTrend: TrendDataPoint[] | undefined;
  categoryAvgTrend: TrendDataPoint[] | undefined;
  productName?: string;
};

export function CategoryComparisonChart({
  productTrend,
  categoryAvgTrend,
  productName,
}: ComparisonChartProps) {
  if (productTrend === undefined || categoryAvgTrend === undefined) {
    return <Skeleton className="h-[350px] w-full" />;
  }

  if (productTrend.length === 0) {
    return (
      <div className="flex h-[350px] items-center justify-center rounded-md border">
        <p className="text-sm text-muted-foreground">
          No trend data for selected product.
        </p>
      </div>
    );
  }

  // Merge both trends by date for Recharts
  const dateSet = new Set([
    ...productTrend.map((d) => d.date),
    ...categoryAvgTrend.map((d) => d.date),
  ]);
  const sortedDates = Array.from(dateSet).sort();

  const productMap = new Map(productTrend.map((d) => [d.date, d.sellThruPercent]));
  const categoryMap = new Map(categoryAvgTrend.map((d) => [d.date, d.sellThruPercent]));

  const mergedData = sortedDates.map((date) => ({
    date,
    product: productMap.get(date) ?? null,
    categoryAvg: categoryMap.get(date) ?? null,
  }));

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={mergedData}
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
            formatter={(value: number, name: string) => [
              `${value}%`,
              name === "product" ? (productName ?? "Product") : "Category Avg",
            ]}
            labelFormatter={formatDateLabel}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #374151",
              backgroundColor: "#1f2937",
              color: "#f3f4f6",
            }}
          />
          <Legend
            formatter={(value: string) =>
              value === "product" ? (productName ?? "Product") : "Category Average"
            }
          />
          <Line
            type="monotone"
            dataKey="product"
            stroke="#2563eb"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#2563eb", strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 6, fill: "#2563eb", strokeWidth: 2, stroke: "#fff" }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="categoryAvg"
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={{ r: 3, fill: "#f59e0b", strokeWidth: 1, stroke: "#fff" }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
