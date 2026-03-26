"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
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
import { ExportExcelButton } from "@/components/export/export-excel-button";
import { ExportPdfButton } from "@/components/export/export-pdf-button";
import type { ReportExportConfig } from "@/lib/types/export";

function formatCurrency(centavos: number): string {
  const pesos = centavos / 100;
  return `₱${pesos.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function MarginErosionTable() {
  const erosionData = useQuery(api.queries.getMarginErosion.getMarginErosion, {});

  const getExportConfig = (): ReportExportConfig => ({
    reportName: "Margin Erosion Report",
    columns: [
      { header: "Style Code", key: "styleCode", type: "string" },
      { header: "Name", key: "name", type: "string" },
      { header: "Department", key: "department", type: "string" },
      { header: "Original SRP", key: "originalSRP", type: "currency" },
      { header: "Current SRP", key: "currentSRP", type: "currency" },
      { header: "SRP Drop %", key: "srpDropPercent", type: "percent" },
      { header: "Margin %", key: "currentMarginPercent", type: "percent" },
    ],
    rows: erosionData ?? [],
  });

  if (erosionData === undefined) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (erosionData.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-md border py-8">
        <p className="text-sm text-muted-foreground">No margin erosion detected.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-2">
        <ExportExcelButton getConfig={getExportConfig} />
        <ExportPdfButton getConfig={getExportConfig} />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Style Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Department</TableHead>
            <TableHead className="text-right">Original SRP</TableHead>
            <TableHead className="text-right">Current SRP</TableHead>
            <TableHead className="text-right">Drop</TableHead>
            <TableHead className="text-right">Margin %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {erosionData.map((product) => (
            <TableRow key={product.productId}>
              <TableCell className="font-medium">{product.styleCode}</TableCell>
              <TableCell>{product.name}</TableCell>
              <TableCell>{product.department}</TableCell>
              <TableCell className="text-right">{formatCurrency(product.originalSRP)}</TableCell>
              <TableCell className="text-right">{formatCurrency(product.currentSRP)}</TableCell>
              <TableCell className="text-right">
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  -{product.srpDropPercent}%
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Badge
                  variant="secondary"
                  className={product.currentMarginPercent >= 30 ? "bg-green-100 text-green-800" : product.currentMarginPercent >= 15 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}
                >
                  {product.currentMarginPercent}%
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
