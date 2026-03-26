"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

type ForecastMode = "ab" | "ml" | "statistical";

export default function MLForecastsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const products = useQuery(api.queries.listProducts.listProducts, {});
  const [selectedProduct, setSelectedProduct] = useState("");
  const [mode, setMode] = useState<ForecastMode>("ab");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateML = useMutation(api.mutations.generateMLForecast.generateMLForecast);
  const computeStat = useMutation(api.mutations.computeForecast.computeForecast);

  const comparison = useQuery(
    api.queries.forecastABComparison.forecastABComparison,
    selectedProduct ? { productId: selectedProduct as Id<"products"> } : "skip"
  );

  const handleGenerate = async () => {
    if (!selectedProduct) return;
    setIsGenerating(true);
    try {
      await computeStat({ productId: selectedProduct as Id<"products"> });
      await generateML({ productId: selectedProduct as Id<"products"> });
      toast({ title: "Forecasts generated" });
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed", variant: "destructive" });
    } finally { setIsGenerating(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ML Demand Forecasts</h1>
          <p className="text-muted-foreground">Compare ML vs statistical forecasting models</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/ml-forecasts/accuracy")}>
            A/B Accuracy
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push("/ml-forecasts/training")}>
            Training
          </Button>
          <Select value={mode} onValueChange={(v) => setMode(v as ForecastMode)}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ab">A/B Comparison</SelectItem>
              <SelectItem value="ml">ML Only</SelectItem>
              <SelectItem value="statistical">Statistical Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-3">
        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
          <SelectTrigger className="w-[350px]">
            <SelectValue placeholder="Select a product">
              {selectedProduct && products
                ? (() => {
                    const p = products.find((p) => p._id === selectedProduct);
                    return p ? `${p.name} (${p.styleCode})` : "Select a product";
                  })()
                : "Select a product"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {products?.map((p) => <SelectItem key={p._id} value={p._id}>{p.name} ({p.styleCode})</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={handleGenerate} disabled={!selectedProduct || isGenerating}>
          {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Generate Forecasts
        </Button>
      </div>

      {!selectedProduct ? (
        <p className="text-center text-muted-foreground py-12">Select a product to view forecasts.</p>
      ) : comparison === undefined ? (
        <Skeleton className="h-64 w-full" />
      ) : comparison === null ? (
        <p className="text-muted-foreground">Product not found.</p>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-3 items-center">
            <h2 className="text-lg font-bold">{comparison.product.name}</h2>
            <span className="text-sm text-muted-foreground">{comparison.product.styleCode}</span>
            {comparison.mlModelAvailable && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">ML v{comparison.mlModelVersion} ({comparison.mlModelAccuracy?.toFixed(1)}%)</Badge>
            )}
          </div>

          <div className={`grid gap-4 ${mode === "ab" ? "md:grid-cols-2" : "md:grid-cols-1"}`}>
            {/* Statistical Forecast */}
            {(mode === "ab" || mode === "statistical") && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Statistical Forecast</CardTitle>
                  <p className="text-xs text-muted-foreground">Weighted moving average</p>
                </CardHeader>
                <CardContent>
                  {comparison.statistical ? (
                    <div className="space-y-3">
                      <Badge variant="secondary">{comparison.statistical.confidence} confidence</Badge>
                      <div className="grid grid-cols-4 gap-2">
                        {comparison.statistical.weekForecasts.map((w) => (
                          <div key={w.weekNumber} className="rounded border p-2 text-center">
                            <p className="text-xs text-muted-foreground">Wk {w.weekNumber}</p>
                            <p className="text-lg font-bold">{w.predictedSellThruPercent.toFixed(1)}%</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{comparison.statistical.dataPointsUsed} data points</p>
                      <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground leading-relaxed">
                        <p className="font-medium text-foreground mb-1">What does this mean?</p>
                        <p>This forecast uses a <strong>weighted average</strong> of your recent weekly sell-thru rates. It gives more weight to the most recent weeks. For example, {comparison.statistical.weekForecasts[0]?.predictedSellThruPercent.toFixed(1)}% means the system predicts about {comparison.statistical.weekForecasts[0]?.predictedSellThruPercent.toFixed(1)}% of remaining stock will sell next week, based on how fast it has been selling recently.</p>
                        <p className="mt-1"><strong>{comparison.statistical.confidence} confidence</strong> means the system {comparison.statistical.confidence === "high" ? "has enough sales history to make a reliable prediction" : comparison.statistical.confidence === "medium" ? "has some sales data but the prediction may shift as more data comes in" : "has very little sales history — take this prediction with a grain of salt"}.</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No statistical forecast. Click Generate.</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ML Forecast */}
            {(mode === "ab" || mode === "ml") && (
              <Card className={comparison.ml ? "border-purple-200" : ""}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">ML Forecast</CardTitle>
                  <p className="text-xs text-muted-foreground">{comparison.ml ? `Model v${comparison.ml.modelVersion}` : "Not available"}</p>
                </CardHeader>
                <CardContent>
                  {comparison.ml ? (
                    <div className="space-y-3">
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                        {(comparison.ml.confidence * 100).toFixed(0)}% confidence
                      </Badge>
                      <div className="grid grid-cols-4 gap-2">
                        {comparison.ml.weekForecasts.map((w) => (
                          <div key={w.weekNumber} className="rounded border border-purple-100 p-2 text-center">
                            <p className="text-xs text-muted-foreground">Wk {w.weekNumber}</p>
                            <p className="text-lg font-bold">{w.predictedSellThruPercent.toFixed(1)}%</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">Generated: {new Date(comparison.ml.createdAt).toLocaleString()}</p>
                      <div className="rounded-md bg-purple-50 dark:bg-purple-950/30 p-3 text-xs text-muted-foreground leading-relaxed">
                        <p className="font-medium text-foreground mb-1">What does this mean?</p>
                        <p>This forecast uses a <strong>machine learning model</strong> that was trained on your historical sales data. Unlike the statistical method, it can detect patterns like seasonality (e.g. certain products sell better in summer) and category trends across branches.</p>
                        <p className="mt-1"><strong>{(comparison.ml.confidence * 100).toFixed(0)}% confidence</strong> means the model is {comparison.ml.confidence >= 0.7 ? "fairly confident" : comparison.ml.confidence >= 0.4 ? "moderately confident" : "still learning and not yet reliable"} in its predictions. The higher this number, the more you can trust the forecast.</p>
                        <p className="mt-1 italic">Compare both sides — if ML consistently predicts closer to actual results than Statistical, it means the ML model has learned useful patterns from your data.</p>
                      </div>
                    </div>
                  ) : !comparison.mlModelAvailable ? (
                    <p className="text-sm text-muted-foreground">No ML model trained. Go to ML Training to train one.</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No ML forecast. Click Generate.</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
