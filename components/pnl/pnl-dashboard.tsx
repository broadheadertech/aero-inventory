"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";

function formatCurrency(centavos: number): string {
  const pesos = centavos / 100;
  return `₱${pesos.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function PnLDashboard() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [branchId, setBranchId] = useState("");
  const [department, setDepartment] = useState("");
  const [dimension, setDimension] = useState("department");

  const pnlData = useQuery(api.queries.getNetworkPnL.getNetworkPnL, {
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    branchId: branchId ? (branchId as Id<"branches">) : undefined,
    department: department || undefined,
    dimension,
  });

  const branches = useQuery(api.queries.listBranches.listBranches, {});
  const products = useQuery(api.queries.listProductsByDepartment.listProductsByDepartment, {});

  const departments = useMemo(
    () => [...new Set(products?.map((p) => p.department) ?? [])].sort(),
    [products]
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="text-xs font-medium mb-1 block">Start</label>
          <Input type="date" className="w-36" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">End</label>
          <Input type="date" className="w-36" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <Select value={branchId || "all"} onValueChange={(v) => setBranchId(v === "all" ? "" : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Branches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {branches?.map((b) => (
              <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={department || "all"} onValueChange={(v) => setDepartment(v === "all" ? "" : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      {pnlData === undefined ? (
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(pnlData.summary.totalRevenue)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Cost</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(pnlData.summary.totalCost)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Margin</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(pnlData.summary.totalMargin)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Margin %</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${pnlData.summary.marginPercent >= 30 ? "text-green-600" : pnlData.summary.marginPercent >= 15 ? "text-amber-600" : "text-red-600"}`}>
                {pnlData.summary.marginPercent}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Breakdown by Dimension */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Breakdown by:</span>
          {["department", "category", "collection", "branch"].map((d) => (
            <Button
              key={d}
              variant={dimension === d ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setDimension(d)}
              className="capitalize"
            >
              {d}
            </Button>
          ))}
        </div>
        {pnlData?.breakdown && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="capitalize">{dimension}</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Margin</TableHead>
                <TableHead className="text-right">Margin %</TableHead>
                <TableHead className="text-right">Units</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pnlData.breakdown.map((row) => (
                <TableRow key={row.key}>
                  <TableCell className="font-medium">{row.label}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.revenue)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.cost)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.margin)}</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="secondary"
                      className={row.marginPercent >= 30 ? "bg-green-100 text-green-800" : row.marginPercent >= 15 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}
                    >
                      {row.marginPercent}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{row.unitsSold}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
