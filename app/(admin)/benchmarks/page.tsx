"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportExcelButton } from "@/components/export/export-excel-button";
import { ExportPdfButton } from "@/components/export/export-pdf-button";
import type { ReportExportConfig } from "@/lib/types/export";

type BenchmarkData = {
  rankings: Array<{ rank: number; branchName: string; sellThruPercent: number; deltaVsAvg: number; totalProducts: number; totalSold: number }>;
  networkAvg: number;
};

function getBenchmarkExportConfig(
  data: BenchmarkData | undefined,
  activeFilters: { department: string; category: string; collection: string }
): ReportExportConfig {
  const rankings = data?.rankings ?? [];
  const filters: Record<string, string> = {
    "Network Avg": `${data?.networkAvg?.toFixed(1) ?? 0}%`,
  };
  if (activeFilters.department) filters["Department"] = activeFilters.department;
  if (activeFilters.category) filters["Category"] = activeFilters.category;
  if (activeFilters.collection) filters["Collection"] = activeFilters.collection;

  return {
    reportName: "Branch Benchmarks",
    columns: [
      { header: "Rank", key: "rank", type: "number" },
      { header: "Branch", key: "branchName", type: "string" },
      { header: "Sell-Thru %", key: "sellThruPercent", type: "percent" },
      { header: "vs Network", key: "deltaVsAvg", type: "percent" },
      { header: "Products", key: "totalProducts", type: "number" },
      { header: "Total Sold", key: "totalSold", type: "number" },
    ],
    rows: rankings.map((r) => ({
      rank: r.rank,
      branchName: r.branchName,
      sellThruPercent: r.sellThruPercent,
      deltaVsAvg: r.deltaVsAvg,
      totalProducts: r.totalProducts,
      totalSold: r.totalSold,
    })),
    filters,
  };
}

export default function BenchmarksPage() {
  const [department, setDepartment] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [collection, setCollection] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("");

  const data = useQuery(api.queries.branchBenchmarks.branchBenchmarks, {
    department: department || undefined,
    category: category || undefined,
    collection: collection || undefined,
  });

  if (data === undefined) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold tracking-tight">Branch Benchmarks</h1></div>
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Branch Benchmarks</h1>
          <p className="text-muted-foreground">Compare branch performance by sell-thru velocity</p>
        </div>
        <div className="flex gap-2">
          <ExportExcelButton getConfig={() => getBenchmarkExportConfig(data, { department, category, collection })} />
          <ExportPdfButton getConfig={() => getBenchmarkExportConfig(data, { department, category, collection })} />
        </div>
      </div>

      <div className="flex gap-3">
        <Select value={department} onValueChange={(v) => setDepartment(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Departments" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {data.filters.departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={(v) => setCategory(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {data.filters.categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={collection} onValueChange={(v) => setCollection(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Collections" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Collections</SelectItem>
            {data.filters.collections.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Network Average Sell-Thru</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{data.networkAvg.toFixed(1)}%</p>
          <p className="text-sm text-muted-foreground">{data.rankings.length} branches ranked</p>
        </CardContent>
      </Card>

      {data.rankings.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No branch data available for selected filters.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Rank</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead className="text-right">Sell-Thru %</TableHead>
              <TableHead className="text-right">vs Network</TableHead>
              <TableHead className="text-right">Products</TableHead>
              <TableHead className="text-right">Total Sold</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rankings.map((r) => (
              <TableRow key={r.branchId}>
                <TableCell>
                  <Badge variant="secondary" className={r.rank <= 3 ? "bg-amber-100 text-amber-800" : ""}>
                    #{r.rank}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{r.branchName}</TableCell>
                <TableCell className="text-right font-bold">{r.sellThruPercent.toFixed(1)}%</TableCell>
                <TableCell className={`text-right font-medium ${r.deltaVsAvg >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {r.deltaVsAvg >= 0 ? "+" : ""}{r.deltaVsAvg.toFixed(1)}%
                </TableCell>
                <TableCell className="text-right">{r.totalProducts}</TableCell>
                <TableCell className="text-right">{r.totalSold.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Category Benchmarks Section */}
      {data.rankings.length > 0 && (
        <div className="space-y-4 border-t pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Category Breakdown</h2>
              <p className="text-sm text-muted-foreground">How does a specific branch compare in each category?</p>
            </div>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select branch" /></SelectTrigger>
              <SelectContent>
                {data.rankings.map((r) => <SelectItem key={r.branchId} value={r.branchId}>{r.branchName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {selectedBranch && <CategoryBenchmarksView branchId={selectedBranch as Id<"branches">} />}
        </div>
      )}
    </div>
  );
}

function CategoryBenchmarksView({ branchId }: { branchId: Id<"branches"> }) {
  const data = useQuery(api.queries.categoryBenchmarks.categoryBenchmarks, { branchId });

  if (data === undefined) return <Skeleton className="h-48 w-full" />;
  if (!data) return <p className="text-muted-foreground">Branch not found.</p>;

  return (
    <div className="space-y-3">
      {data.improvementCount > 0 && (
        <p className="text-sm text-amber-600 font-medium">
          {data.improvementCount} improvement {data.improvementCount === 1 ? "opportunity" : "opportunities"} detected
        </p>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">{data.branchName}</TableHead>
            <TableHead className="text-right">Network Avg</TableHead>
            <TableHead className="text-right">Delta</TableHead>
            <TableHead>Top Performer</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.categories.map((c) => (
            <TableRow key={c.category} className={c.isImprovementOpportunity ? "bg-amber-50" : ""}>
              <TableCell className="font-medium">{c.category}</TableCell>
              <TableCell className="text-right font-bold">{c.mySellThru.toFixed(1)}%</TableCell>
              <TableCell className="text-right">{c.networkAvg.toFixed(1)}%</TableCell>
              <TableCell className={`text-right font-medium ${c.delta >= 0 ? "text-green-600" : "text-red-600"}`}>
                {c.delta >= 0 ? "+" : ""}{c.delta.toFixed(1)}%
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {c.topPerformer.branchName} ({c.topPerformer.sellThru.toFixed(1)}%)
              </TableCell>
              <TableCell>
                {c.isImprovementOpportunity ? (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">Improve</Badge>
                ) : c.delta >= 0 ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Above Avg</Badge>
                ) : (
                  <Badge variant="secondary">Below Avg</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
