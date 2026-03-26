"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DeliveryForm } from "./delivery-form";
import { CsvImportDialog } from "./csv-import-dialog";
import { Plus, Upload } from "lucide-react";

type SupplierScorecardProps = {
  supplierId: Id<"suppliers">;
};

const statusColors: Record<string, string> = {
  "on-time": "bg-green-100 text-green-800",
  "slightly-late": "bg-amber-100 text-amber-800",
  "late": "bg-red-100 text-red-800",
};

export function SupplierScorecard({ supplierId }: SupplierScorecardProps) {
  const data = useQuery(api.queries.supplierScorecard.supplierScorecard, { supplierId });
  const [deliveryFormOpen, setDeliveryFormOpen] = useState(false);
  const [csvImportOpen, setCsvImportOpen] = useState(false);

  if (data === undefined) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  if (!data) return <p className="text-muted-foreground">Supplier not found.</p>;

  const { supplier, deliveries, metrics } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{supplier.name}</h2>
          <p className="text-sm text-muted-foreground">{supplier.contactName} &middot; {supplier.contactEmail}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCsvImportOpen(true)}><Upload className="mr-2 h-4 w-4" />Import CSV</Button>
          <Button onClick={() => setDeliveryFormOpen(true)}><Plus className="mr-2 h-4 w-4" />Record Delivery</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Deliveries</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{metrics.totalDeliveries}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">On-Time Rate</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{(metrics.onTimeRate * 100).toFixed(1)}%</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Avg Variance</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{metrics.avgLeadTimeVariance.toFixed(1)}d</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Rejection Rate</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{(metrics.qualityRejectionRate * 100).toFixed(1)}%</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Composite Score</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{(metrics.compositeScore * 100).toFixed(0)}</p></CardContent>
        </Card>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold">Delivery History</h3>
        {deliveries.length === 0 ? (
          <p className="text-muted-foreground">No deliveries recorded yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Promised</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ordered</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead className="text-right">Rejected</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveries.map((d) => (
                <TableRow key={d._id}>
                  <TableCell>{d.promisedDate}</TableCell>
                  <TableCell>{d.actualDate}</TableCell>
                  <TableCell><Badge variant="secondary" className={statusColors[d.status] ?? ""}>{d.status}</Badge></TableCell>
                  <TableCell className="text-right">{d.quantityOrdered}</TableCell>
                  <TableCell className="text-right">{d.quantityReceived}</TableCell>
                  <TableCell className="text-right">{d.qualityRejected}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{d.qualityNotes ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <DeliveryForm open={deliveryFormOpen} onOpenChange={setDeliveryFormOpen} supplierId={supplierId} />
      <CsvImportDialog open={csvImportOpen} onOpenChange={setCsvImportOpen} supplierId={supplierId} />
    </div>
  );
}
