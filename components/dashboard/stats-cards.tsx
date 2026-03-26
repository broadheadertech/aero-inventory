"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Store, TrendingUp, AlertTriangle } from "lucide-react";

export function StatsCards() {
  const stats = useQuery(api.queries.dashboardStats.dashboardStats, {});

  if (stats === undefined) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.totalProducts}</p>
          <p className="text-xs text-muted-foreground">{stats.activeBranches} active branches</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">SOH Value</CardTitle>
          <Store className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">₱{(stats.totalSOHValue / 100).toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          <p className="text-xs text-muted-foreground">{stats.totalSOH.toLocaleString()} units on hand</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Network Sell-Thru</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.networkSellThru}%</p>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-600">{stats.fastCount} Fast</span>
            {" / "}
            <span className="text-amber-600">{stats.midCount} Mid</span>
            {" / "}
            <span className="text-red-600">{stats.slowCount} Slow</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Slow Movers</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-red-600">{stats.slowCount}</p>
          <p className="text-xs text-muted-foreground">
            {stats.totalBranchProducts > 0 ? Math.round((stats.slowCount / stats.totalBranchProducts) * 100) : 0}% of inventory
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
