"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const tierColors: Record<string, string> = {
  bronze: "bg-amber-100 text-amber-800",
  silver: "bg-gray-200 text-gray-800",
  gold: "bg-yellow-100 text-yellow-800",
  platinum: "bg-purple-100 text-purple-800",
};

export default function LoyaltyPage() {
  const analytics = useQuery(api.queries.loyaltyQueries.loyaltyAnalytics, {});
  const members = useQuery(api.queries.loyaltyQueries.listLoyaltyMembers, {});

  if (analytics === undefined || members === undefined) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold tracking-tight">Loyalty Program</h1></div>
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Loyalty Program</h1>
        <p className="text-muted-foreground">Customer loyalty analytics and member directory</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Total Members</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{analytics.totalMembers}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Active Rate</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{analytics.activeRate}%</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Total Spend</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">₱{(analytics.totalSpend / 100).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Avg Spend/Member</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">₱{(analytics.avgSpendPerMember / 100).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p></CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        {analytics.tierBreakdown.map((t) => (
          <Badge key={t.tier} variant="secondary" className={`${tierColors[t.tier] ?? ""} text-sm px-3 py-1`}>
            {t.tier}: {t.count}
          </Badge>
        ))}
      </div>

      {members.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No loyalty members yet. Configure the loyalty API in Settings.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead className="text-right">Purchases</TableHead>
              <TableHead>Preferred Categories</TableHead>
              <TableHead>Last Visit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.slice(0, 50).map((m) => (
              <TableRow key={m._id}>
                <TableCell className="font-medium">{m.name}</TableCell>
                <TableCell><Badge variant="secondary" className={tierColors[m.tier] ?? ""}>{m.tier}</Badge></TableCell>
                <TableCell className="text-right">{m.purchaseCount}</TableCell>
                <TableCell>
                  <div className="flex gap-1">{m.preferredCategories.map((c) => <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>)}</div>
                </TableCell>
                <TableCell className="text-sm">{m.lastVisitDate ? new Date(m.lastVisitDate).toLocaleDateString() : "Never"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
