"use client";

import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, ArrowUpRight } from "lucide-react";
import type { TrendDataPoint } from "@/convex/helpers/trendCalculation";
import { computeTrajectoryFromDelta, type TrajectoryDirection } from "@/lib/utils/trajectory";

type TrajectoryIndicatorProps = {
  trend: TrendDataPoint[];
};

const TRAJECTORY_UI = {
  fast: { label: "Trending Fast", color: "bg-green-100 text-green-800", icon: TrendingUp },
  mid: { label: "Trending Mid", color: "bg-amber-100 text-amber-800", icon: ArrowUpRight },
  slow: { label: "Trending Slow", color: "bg-red-100 text-red-800", icon: TrendingDown },
  stable: { label: "Stable", color: "bg-gray-100 text-gray-800", icon: Minus },
} satisfies Record<TrajectoryDirection, { label: string; color: string; icon: typeof TrendingUp }>;

export function TrajectoryIndicator({ trend }: TrajectoryIndicatorProps) {
  if (trend.length < 2) {
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
        <Minus className="mr-1 h-3 w-3" />
        Insufficient Data
      </Badge>
    );
  }

  const latest = trend[trend.length - 1].sellThruPercent;
  const previous = trend[trend.length - 2].sellThruPercent;
  const direction = computeTrajectoryFromDelta(latest - previous, latest);
  const result = TRAJECTORY_UI[direction];
  const Icon = result.icon;

  return (
    <Badge variant="secondary" className={result.color}>
      <Icon className="mr-1 h-3 w-3" />
      {result.label}
    </Badge>
  );
}
