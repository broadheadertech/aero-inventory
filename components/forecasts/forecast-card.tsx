"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

type ForecastCardProps = {
  productId: Id<"products">;
  branchId?: Id<"branches">;
};

const confidenceColors: Record<string, string> = {
  high: "bg-green-100 text-green-800",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-red-100 text-red-800",
};

export function ForecastCard({ productId, branchId }: ForecastCardProps) {
  const { toast } = useToast();
  const [isComputing, setIsComputing] = useState(false);
  const data = useQuery(api.queries.getProductForecast.getProductForecast, { productId, branchId });
  const compute = useMutation(api.mutations.computeForecast.computeForecast);

  const handleCompute = async () => {
    setIsComputing(true);
    try {
      await compute({ productId, branchId });
      toast({ title: "Forecast computed" });
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed", variant: "destructive" });
    } finally { setIsComputing(false); }
  };

  if (data === undefined) return <Skeleton className="h-48 w-full" />;
  if (!data) return <p className="text-muted-foreground">Product not found.</p>;

  const { product, forecast } = data;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg">{product.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{product.sku}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleCompute} disabled={isComputing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isComputing ? "animate-spin" : ""}`} />
          {forecast ? "Refresh" : "Compute"}
        </Button>
      </CardHeader>
      <CardContent>
        {!forecast ? (
          <p className="text-muted-foreground text-sm">No forecast available. Click Compute to generate.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className={confidenceColors[forecast.confidence]}>
                {forecast.confidence} confidence
              </Badge>
              <span className="text-xs text-muted-foreground">{forecast.dataPointsUsed} data points used</span>
              {forecast.weatherAdjusted && <Badge variant="secondary">Weather adjusted</Badge>}
            </div>

            <div className="grid grid-cols-4 gap-3">
              {forecast.weekForecasts.map((w) => (
                <div key={w.weekNumber} className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Week {w.weekNumber}</p>
                  <p className="text-xl font-bold">{w.predictedSellThruPercent.toFixed(1)}%</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">Forecast generated: {new Date(forecast.createdAt).toLocaleString()}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
