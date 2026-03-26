"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Play } from "lucide-react";

const statusColors: Record<string, string> = {
  training: "bg-blue-100 text-blue-800",
  ready: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  retired: "bg-gray-100 text-gray-800",
};

export default function MLTrainingPage() {
  const { toast } = useToast();
  const models = useQuery(api.queries.listMLModels.listMLModels, {});
  const trainModel = useMutation(api.mutations.triggerMLTraining.triggerMLTrainingManual);
  const [isTraining, setIsTraining] = useState(false);

  const handleTrain = async () => {
    setIsTraining(true);
    try {
      const result = await trainModel({});
      toast({ title: `Model v${result.modelVersion} trained — ${result.accuracy}% accuracy` });
    } catch (error) {
      toast({ title: "Training failed", description: error instanceof Error ? error.message : "Error", variant: "destructive" });
    } finally { setIsTraining(false); }
  };

  const latestReady = models?.find((m) => m.status === "ready");

  if (models === undefined) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold tracking-tight">ML Model Training</h1></div>
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ML Model Training</h1>
          <p className="text-muted-foreground">Train and manage demand forecasting models</p>
        </div>
        <Button onClick={handleTrain} disabled={isTraining}>
          {isTraining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
          Train New Model
        </Button>
      </div>

      {/* Explanation */}
      <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
        <p className="font-medium text-foreground mb-2">How does model training work?</p>
        <p>When you click <strong>&quot;Train New Model&quot;</strong>, the system looks at all your historical sales data — how much each product sold per week, at which branches, during which seasons — and learns the patterns. Think of it like teaching someone your business: &quot;This type of product sells faster in summer&quot; or &quot;Branch A always sells more tops than Branch B.&quot;</p>
        <p className="mt-2"><strong>Accuracy</strong> tells you how good the model is at predicting. For example, 70% accuracy means that when the model predicts a product will sell 100 units, the actual result is usually between 70–130 units. Higher accuracy = more trustworthy forecasts.</p>
        <p className="mt-2"><strong>Features</strong> are the data points the model uses to learn — things like weekly sell-thru rate, product category, branch location, and time of year. More features usually means better predictions, but only if there is enough data to learn from.</p>
        <p className="mt-2">Each new model gets a version number (v1.0.0, v1.1.0, etc.). The system keeps old models so you can compare how accuracy improves over time as more sales data comes in.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Total Models</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{models.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Latest Version</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{latestReady?.modelVersion ?? "None"}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Best Accuracy</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{latestReady?.accuracy?.toFixed(1) ?? 0}%</p></CardContent>
        </Card>
      </div>

      {/* Table explanation */}
      <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Understanding the table below</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Version</strong> — Each training run creates a new version. Newer versions use more recent data.</li>
          <li><strong>Status</strong> — <span className="text-green-600 font-medium">ready</span> means the model is active and generating forecasts. <span className="text-blue-600 font-medium">training</span> means it is still processing. <span className="text-gray-500 font-medium">retired</span> means it was replaced by a newer model.</li>
          <li><strong>Accuracy</strong> — How closely the model&apos;s predictions matched actual sales in testing. Aim for 65%+ for useful forecasts.</li>
          <li><strong>Data Range</strong> — The time period of sales history the model learned from. Longer ranges generally produce better models.</li>
        </ul>
      </div>

      {models.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No models trained yet. Click &quot;Train New Model&quot; to start.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Accuracy</TableHead>
              <TableHead>Features</TableHead>
              <TableHead>Data Range</TableHead>
              <TableHead>Trained</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.map((m) => (
              <TableRow key={m._id}>
                <TableCell className="font-mono font-medium">v{m.modelVersion}</TableCell>
                <TableCell><Badge variant="secondary" className={statusColors[m.status] ?? ""}>{m.status}</Badge></TableCell>
                <TableCell className="text-right font-bold">{m.accuracy?.toFixed(1) ?? "—"}%</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {m.featureSet.slice(0, 3).map((f) => <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>)}
                    {m.featureSet.length > 3 && <Badge variant="secondary" className="text-xs">+{m.featureSet.length - 3}</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-sm">{m.trainingDataRange}</TableCell>
                <TableCell className="text-sm">{m.trainedAt ? new Date(m.trainedAt).toLocaleString() : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
