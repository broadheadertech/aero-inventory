"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";

const sentimentColors: Record<string, string> = {
  positive: "bg-green-100 text-green-800",
  neutral: "bg-gray-100 text-gray-800",
  negative: "bg-red-100 text-red-800",
};

const classificationColors: Record<string, string> = {
  Fast: "text-green-600",
  Mid: "text-amber-600",
  Slow: "text-red-600",
};

export default function FeedbackPage() {
  const correlation = useQuery(api.queries.feedbackSellThruCorrelation.feedbackSellThruCorrelation, {});

  if (correlation === undefined) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold tracking-tight">Customer Feedback</h1></div>
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      </div>
    );
  }

  const totalFeedback = correlation.reduce((sum, c) => sum + (c?.feedbackCount ?? 0), 0);
  const productsWithNegative = correlation.filter((c) => c?.hasNegativeFeedback).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Customer Feedback</h1>
        <p className="text-muted-foreground">Feedback themes correlated with sell-thru performance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Total Feedback</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalFeedback}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Products with Feedback</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{correlation.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Negative Sentiment Products</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-600">{productsWithNegative}</p></CardContent>
        </Card>
      </div>

      {correlation.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No customer feedback yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Classification</TableHead>
              <TableHead className="text-right">Sell-Thru %</TableHead>
              <TableHead className="text-right">Rating</TableHead>
              <TableHead className="text-right">Feedback</TableHead>
              <TableHead>Sentiment</TableHead>
              <TableHead>Themes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {correlation.map((c) => {
              if (!c) return null;
              return (
                <TableRow key={c.productId} className={c.hasNegativeFeedback ? "bg-red-50" : ""}>
                  <TableCell>
                    <span className="font-medium">{c.productName}</span>
                    <br /><span className="text-xs text-muted-foreground">{c.styleCode}</span>
                  </TableCell>
                  <TableCell>
                    <span className={`font-bold ${classificationColors[c.classification] ?? ""}`}>{c.classification}</span>
                  </TableCell>
                  <TableCell className="text-right">{c.sellThruPercent.toFixed(1)}%</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {c.avgRating}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{c.feedbackCount}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {c.positiveCount > 0 && <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">{c.positiveCount} pos</Badge>}
                      {c.negativeCount > 0 && <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">{c.negativeCount} neg</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {c.themes.map((t) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
