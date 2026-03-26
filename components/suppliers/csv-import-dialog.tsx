"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";

type CsvImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: Id<"suppliers">;
};

type CsvRow = {
  promisedDate: string;
  actualDate: string;
  quantityOrdered: string;
  quantityReceived: string;
  qualityRejected?: string;
  qualityNotes?: string;
};

export function CsvImportDialog({ open, onOpenChange, supplierId }: CsvImportDialogProps) {
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [preview, setPreview] = useState<CsvRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const recordDelivery = useMutation(api.mutations.recordDelivery.recordDelivery);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validationErrors: string[] = [];
        const required = ["promisedDate", "actualDate", "quantityOrdered", "quantityReceived"];
        const headers = results.meta.fields ?? [];
        for (const field of required) {
          if (!headers.includes(field)) validationErrors.push(`Missing column: ${field}`);
        }
        if (validationErrors.length > 0) {
          setErrors(validationErrors);
          setPreview([]);
          return;
        }
        setPreview(results.data.slice(0, 100));
        setErrors([]);
      },
      error: (err) => {
        setErrors([err.message]);
        setPreview([]);
      },
    });
  };

  const handleImport = async () => {
    setIsImporting(true);
    let success = 0;
    let failed = 0;
    for (const row of preview) {
      try {
        await recordDelivery({
          supplierId,
          promisedDate: row.promisedDate,
          actualDate: row.actualDate,
          quantityOrdered: Number(row.quantityOrdered),
          quantityReceived: Number(row.quantityReceived),
          qualityRejected: Number(row.qualityRejected ?? 0),
          qualityNotes: row.qualityNotes || undefined,
        });
        success++;
      } catch {
        failed++;
      }
    }
    setIsImporting(false);
    toast({ title: `Import complete: ${success} added, ${failed} failed` });
    if (failed === 0) {
      onOpenChange(false);
      setPreview([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Deliveries from CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            CSV must include columns: promisedDate, actualDate, quantityOrdered, quantityReceived. Optional: qualityRejected, qualityNotes.
          </p>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer" />
          {errors.length > 0 && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errors.map((e, i) => <p key={i}>{e}</p>)}
            </div>
          )}
          {preview.length > 0 && (
            <div className="text-sm">
              <p className="font-medium">{preview.length} rows ready to import</p>
              <div className="mt-2 max-h-40 overflow-auto rounded border text-xs">
                <table className="w-full">
                  <thead><tr className="bg-muted">{Object.keys(preview[0]).map((k) => <th key={k} className="px-2 py-1 text-left">{k}</th>)}</tr></thead>
                  <tbody>{preview.slice(0, 5).map((row, i) => <tr key={i}>{Object.values(row).map((v, j) => <td key={j} className="px-2 py-1">{v}</td>)}</tr>)}</tbody>
                </table>
                {preview.length > 5 && <p className="px-2 py-1 text-muted-foreground">...and {preview.length - 5} more rows</p>}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleImport} disabled={preview.length === 0 || isImporting}>
              {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Import {preview.length} Rows
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
