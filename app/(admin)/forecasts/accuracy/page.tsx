"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const confidenceColors: Record<string, string> = {
  high: "bg-green-100 text-green-800",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-red-100 text-red-800",
};

export default function ForecastAccuracyPage() {
  const data = useQuery(api.queries.forecastAccuracy.forecastAccuracy, {});

  if (data === undefined) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Forecast Accuracy</h1>
        <p className="text-muted-foreground">Compare predicted vs actual sell-thru</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Overall Forecast Accuracy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">{data.overallAccuracy.toFixed(1)}%</p>
          <p className="text-sm text-muted-foreground">{data.results.length} forecasts evaluated</p>
        </CardContent>
      </Card>

      {data.results.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No past forecasts to evaluate yet. Forecasts need at least 1 week of actuals for comparison.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Predicted %</TableHead>
              <TableHead className="text-right">Actual %</TableHead>
              <TableHead className="text-right">Variance</TableHead>
              <TableHead className="text-right">Accuracy</TableHead>
              <TableHead>Confidence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.map((r) => (
              <TableRow key={r.forecastId}>
                <TableCell>{r.forecastDate}</TableCell>
                <TableCell className="font-medium">{r.productName}<br /><span className="text-xs text-muted-foreground">{r.productSku}</span></TableCell>
                <TableCell className="text-right">{r.predicted.toFixed(1)}%</TableCell>
                <TableCell className="text-right">{r.actual.toFixed(1)}%</TableCell>
                <TableCell className="text-right">{r.variance.toFixed(1)}%</TableCell>
                <TableCell className="text-right font-medium" style={{ color: r.accuracy >= 80 ? "#16a34a" : r.accuracy >= 60 ? "#d97706" : "#dc2626" }}>
                  {r.accuracy.toFixed(1)}%
                </TableCell>
                <TableCell><Badge variant="secondary" className={confidenceColors[r.confidence]}>{r.confidence}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
