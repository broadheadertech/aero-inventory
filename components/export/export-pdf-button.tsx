"use client";

import { useState } from "react";
import { AlertCircle, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToPdf } from "@/lib/export/pdf";
import type { ReportExportConfig } from "@/lib/types/export";

type ExportPdfButtonProps = {
  getConfig: () => ReportExportConfig;
};

export function ExportPdfButton({ getConfig }: ExportPdfButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    setError(false);
    try {
      await new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          try {
            exportToPdf(getConfig());
            resolve();
          } catch (e) {
            reject(e);
          }
        }, 0);
      });
    } catch (e) {
      console.error("PDF export failed:", e);
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
        <FileText className="h-4 w-4 mr-2" />
      )}
      {error ? "Export Failed" : "Export PDF"}
    </Button>
  );
}
