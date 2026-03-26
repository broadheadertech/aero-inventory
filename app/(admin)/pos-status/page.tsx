"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

export default function PosStatusPage() {
  const statuses = useQuery(api.queries.posSyncStatus.posSyncStatus, {});
  const [expandedBranch, setExpandedBranch] = useState<Id<"branches"> | null>(null);

  if (statuses === undefined) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold tracking-tight">POS Sync Status</h1></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      </div>
    );
  }

  const configured = statuses.filter((s) => !s.manualOnly);
  const manual = statuses.filter((s) => s.manualOnly);
  const totalSynced = configured.reduce((sum, s) => sum + s.syncSuccessCount, 0);
  const totalErrors = configured.reduce((sum, s) => sum + s.syncErrorCount, 0);
  const totalVolume = configured.reduce((sum, s) => sum + s.syncSuccessCount + s.syncErrorCount, 0);
  const avgSuccessRate = totalVolume > 0
    ? (totalSynced / totalVolume) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">POS Sync Status</h1>
        <p className="text-muted-foreground">Monitor POS integration health across all branches</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Connected Branches</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{configured.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Total Synced</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalSynced.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Total Errors</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-600">{totalErrors}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Avg Success Rate</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{avgSuccessRate.toFixed(1)}%</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {configured.map((s) => {
          const isExpanded = expandedBranch === s.branchId;
          return (
            <Card key={s.branchId} className={!s.isEnabled ? "opacity-60" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{s.branchName}</CardTitle>
                  <Badge variant="secondary" className={s.isEnabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {s.isEnabled ? "Active" : "Disabled"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Success Rate</p>
                    <p className={`font-bold ${s.successRate >= 95 ? "text-green-600" : s.successRate >= 80 ? "text-amber-600" : "text-red-600"}`}>
                      {s.successRate}%
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Synced</p>
                    <p className="font-bold">{s.syncSuccessCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Errors</p>
                    <p className="font-bold text-red-600">{s.syncErrorCount}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Last sync: {s.lastSyncAt ? new Date(s.lastSyncAt).toLocaleString() : "Never"}
                </p>

                {s.recentErrors.length > 0 && (
                  <div>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-xs" onClick={() => setExpandedBranch(isExpanded ? null : s.branchId)}>
                      {isExpanded ? <ChevronDown className="mr-1 h-3 w-3" /> : <ChevronRight className="mr-1 h-3 w-3" />}
                      {s.recentErrors.length} recent errors
                    </Button>
                    {isExpanded && (
                      <div className="mt-2 max-h-32 overflow-auto rounded border text-xs">
                        <Table>
                          <TableHeader>
                            <TableRow><TableHead className="text-xs">SKU</TableHead><TableHead className="text-xs">Error</TableHead></TableRow>
                          </TableHeader>
                          <TableBody>
                            {s.recentErrors.map((e, i) => (
                              <TableRow key={i}>
                                <TableCell className="font-mono text-xs">{e.sku}</TableCell>
                                <TableCell className="text-xs">{e.error}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {manual.map((s) => (
          <Card key={s.branchId} className="opacity-50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{s.branchName}</CardTitle>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">Manual Entry Only</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No POS configured. Sales entered manually by Branch Staff.</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
