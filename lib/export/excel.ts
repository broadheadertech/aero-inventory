import * as XLSX from "xlsx";
import type { ReportExportConfig } from "@/lib/types/export";

export function exportToExcel(config: ReportExportConfig): void {
  const { reportName, columns, rows, filters, dateRange, timePeriod } = config;

  // Build info header line
  const infoParts: string[] = [reportName];
  if (timePeriod) infoParts.push(`Period: ${timePeriod}`);
  if (dateRange) infoParts.push(`Range: ${dateRange}`);
  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (value) infoParts.push(`${key}: ${value}`);
    }
  }
  infoParts.push(`Generated: ${new Date().toLocaleString()}`);

  // Build array-of-arrays data
  const aoa: unknown[][] = [];

  // Row 1: info header spanning all columns
  aoa.push([infoParts.join(" | ")]);

  // Row 2: empty spacer
  aoa.push([]);

  // Row 3: column headers
  aoa.push(columns.map((c) => c.header));

  // Data rows
  for (const row of rows) {
    const dataRow: unknown[] = columns.map((col) => {
      const value = row[col.key];
      if (value === null || value === undefined) return "";
      switch (col.type) {
        case "number":
          return typeof value === "number" ? value : Number(value) || "";
        case "percent":
          return typeof value === "number" ? value : "";
        case "currency":
          return typeof value === "number" ? value / 100 : "";
        case "date":
          return typeof value === "string" ? value : String(value);
        default:
          return String(value);
      }
    });
    aoa.push(dataRow);
  }

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Merge info header across all columns
  if (columns.length > 1) {
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } }];
  }

  // Set column widths based on header length + some padding
  ws["!cols"] = columns.map((col) => ({
    wch: Math.max(col.header.length + 4, 12),
  }));

  // Apply number formats to data cells (starting at row index 3)
  const dataStartRow = 3;
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < columns.length; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: dataStartRow + r, c });
      const cell = ws[cellRef];
      if (!cell) continue;

      switch (columns[c].type) {
        case "percent":
          if (typeof cell.v === "number") {
            cell.t = "n";
            cell.z = "0.00\"%\"";
          }
          break;
        case "currency":
          if (typeof cell.v === "number") {
            cell.t = "n";
            cell.z = "₱#,##0.00";
          }
          break;
        case "number":
          if (typeof cell.v === "number") {
            cell.t = "n";
          }
          break;
      }
    }
  }

  // Create workbook and trigger download
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, reportName.substring(0, 31));

  const today = new Date().toISOString().split("T")[0];
  const filename = `${reportName.replace(/\s+/g, "-").toLowerCase()}-${today}.xlsx`;
  XLSX.writeFile(wb, filename);
}
