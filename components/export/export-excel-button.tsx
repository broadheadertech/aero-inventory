"use client";

import { useState } from "react";
import { AlertCircle, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToExcel } from "@/lib/export/excel";
import type { ReportExportConfig } from "@/lib/types/export";

type ExportExcelButtonProps = {
  getConfig: () => ReportExportConfig;
};

export function ExportExcelButton({ getConfig }: ExportExcelButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const [error, setError] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    setError(false);
    try {
      // Use setTimeout to allow the UI to update before the synchronous export runs
      await new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          try {
            exportToExcel(getConfig());
            resolve();
          } catch (e) {
            reject(e);
          }
        }, 0);
      });
    } catch (e) {
      console.error("Export failed:", e);
      setError(true);
      setTimeout(() => setError(false), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant={error ? "destructive" : "outline"}
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : error ? (
        <AlertCircle className="h-4 w-4 mr-2" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      {error ? "Export Failed" : "Export Excel"}
    </Button>
  );
}
