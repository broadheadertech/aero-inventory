"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, TrendingUp, Package, Store, AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";

export function NetworkSnapshotCards() {
  const snapshot = useQuery(api.queries.getNetworkSnapshot.getNetworkSnapshot, {});
  const triggerCompute = useMutation(api.mutations.triggerSnapshotCompute.triggerSnapshotCompute);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await triggerCompute({});
    } finally {
      setTimeout(() => setRefreshing(false), 3000);
    }
  };

  if (snapshot === undefined) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
    );
  }

  if (snapshot === null) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground mb-3">No snapshot data yet. Compute your first snapshot to see network-wide KPIs.</p>
        <Button onClick={handleRefresh} disabled={refreshing} size="sm">
          {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Compute Now
        </Button>
      </div>
    );
  }

  const retailValuePesos = snapshot.totalRetailValue / 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">Network Snapshot</h2>
          <Badge variant="secondary" className="text-[10px]">
            Updated {new Date(snapshot.updatedAt).toLocaleTimeString()}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Network Sell-Thru</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{snapshot.networkSellThru.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">
              {snapshot.totalSold.toLocaleString()} sold / {snapshot.totalBeg.toLocaleString()} BEG
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Stock on Hand</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{snapshot.totalSOH.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
              {"\u20B1"}{retailValuePesos.toLocaleString("en-PH", { minimumFractionDigits: 0 })} retail value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Branches</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{snapshot.totalBranches}</p>
            <p className="text-xs text-muted-foreground">
              {snapshot.totalProducts} active products
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Classification</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-3">
              <span className="text-green-600 font-bold">{snapshot.fastMoverCount}F</span>
              <span className="text-amber-600 font-bold">{snapshot.midMoverCount}M</span>
              <span className="text-red-600 font-bold">{snapshot.slowMoverCount}S</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {snapshot.slowMoverCount > 0 ? `${snapshot.slowMoverCount} slow movers need attention` : "No slow movers"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Branch Rankings */}
      {snapshot.branchRankings.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Branch Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {snapshot.branchRankings.slice(0, 10).map((b) => (
                <div key={b.branchId} className="flex items-center gap-3">
                  <Badge variant="secondary" className={`w-8 justify-center ${b.rank <= 3 ? "bg-amber-100 text-amber-800" : ""}`}>
                    #{b.rank}
                  </Badge>
                  <span className="flex-1 text-sm font-medium truncate">{b.branchName}</span>
                  <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        b.sellThru >= 60 ? "bg-green-500" : b.sellThru >= 30 ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(b.sellThru, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold w-14 text-right">{b.sellThru.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
