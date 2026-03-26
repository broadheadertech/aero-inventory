"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const winnerColors: Record<string, string> = {
  ml: "bg-purple-100 text-purple-800",
  statistical: "bg-blue-100 text-blue-800",
  tie: "bg-gray-100 text-gray-800",
};

export default function MLAccuracyPage() {
  const data = useQuery(api.queries.forecastABAccuracy.forecastABAccuracy, {});

  if (data === undefined) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold tracking-tight">Forecast A/B Accuracy</h1></div>
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Forecast A/B Accuracy</h1>
        <p className="text-muted-foreground">Compare ML vs Statistical forecast performance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Statistical Accuracy</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-blue-600">{data.overallStatAccuracy.toFixed(1)}%</p><p className="text-xs text-muted-foreground">{data.statForecastCount} forecasts</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">ML Accuracy</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-purple-600">{data.overallMLAccuracy.toFixed(1)}%</p><p className="text-xs text-muted-foreground">{data.mlForecastCount} forecasts</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Winner</CardTitle></CardHeader>
          <CardContent>
            <Badge variant="secondary" className={`text-lg px-3 py-1 ${winnerColors[data.overallWinner]}`}>
              {data.overallWinner === "ml" ? "ML" : data.overallWinner === "statistical" ? "Statistical" : "Tie"}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Improvement</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${data.overallMLAccuracy > data.overallStatAccuracy ? "text-green-600" : "text-red-600"}`}>
              {data.overallMLAccuracy > data.overallStatAccuracy ? "+" : ""}{(data.overallMLAccuracy - data.overallStatAccuracy).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {data.results.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No past forecasts to compare yet. Generate forecasts and wait at least 1 week for actuals.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Statistical %</TableHead>
              <TableHead className="text-right">ML %</TableHead>
              <TableHead>Winner</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.map((r) => (
              <TableRow key={r.productId}>
                <TableCell className="font-medium">{r.productName}</TableCell>
                <TableCell className="text-right font-bold text-blue-600">{r.statAccuracy?.toFixed(1) ?? "—"}%</TableCell>
                <TableCell className="text-right font-bold text-purple-600">{r.mlAccuracy?.toFixed(1) ?? "—"}%</TableCell>
                <TableCell>
                  {r.winner ? (
                    <Badge variant="secondary" className={winnerColors[r.winner]}>
                      {r.winner === "ml" ? "ML" : r.winner === "statistical" ? "Stat" : "Tie"}
                    </Badge>
                  ) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
