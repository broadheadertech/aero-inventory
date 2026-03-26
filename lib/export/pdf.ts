import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { ReportExportConfig } from "@/lib/types/export";

const CLASSIFICATION_COLORS: Record<string, [number, number, number]> = {
  Fast: [22, 163, 74],
  Mid: [217, 119, 6],
  Slow: [220, 38, 38],
};

function formatCellValue(
  value: unknown,
  type: string
): string {
  if (value === null || value === undefined) return "";

  switch (type) {
    case "number":
      return typeof value === "number" ? String(value) : "";
    case "percent":
      return typeof value === "number" ? `${value.toFixed(2)}%` : "";
    case "currency": {
      if (typeof value !== "number") return "";
      const pesos = value / 100;
      return `₱${pesos.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    case "date":
      return typeof value === "string" ? value : String(value);
    default:
      return String(value);
  }
}

export function exportToPdf(config: ReportExportConfig): void {
  const { reportName, columns, rows, filters, dateRange, timePeriod } = config;

  const doc = new jsPDF({ orientation: "landscape" });

  // --- Draw PDF header ---
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(reportName, 14, 15);

  // Filter summary line
  const infoParts: string[] = [];
  if (timePeriod) infoParts.push(`Period: ${timePeriod}`);
  if (dateRange) infoParts.push(`Range: ${dateRange}`);
  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (value) infoParts.push(`${key}: ${value}`);
    }
  }

  let currentY = 22;
  if (infoParts.length > 0) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - 28; // 14mm margin each side
    const filterText = infoParts.join("  |  ");
    const lines = doc.splitTextToSize(filterText, maxWidth);
    doc.text(lines, 14, currentY);
    currentY += lines.length * 4.5;
  }

  // Generated timestamp
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, currentY);
  doc.setTextColor(0, 0, 0);
  currentY += 6;

  // --- Build table data ---
  const head = [columns.map((c) => c.header)];

  const body: string[][] = rows.map((row) =>
    columns.map((col) => formatCellValue(row[col.key], col.type))
  );

  // Find classification column index for color coding
  const classificationColIndex = columns.findIndex(
    (c) => c.key === "classification"
  );

  // --- Generate table ---
  autoTable(doc, {
    head,
    body,
    startY: currentY,
    theme: "grid",
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    styles: {
      cellPadding: 2,
      overflow: "linebreak",
    },
    margin: { top: 10, right: 14, bottom: 10, left: 14 },
    didParseCell: (data) => {
      if (
        classificationColIndex >= 0 &&
        data.section === "body" &&
        data.column.index === classificationColIndex
      ) {
        const val = data.cell.raw as string;
        const color = CLASSIFICATION_COLORS[val];
        if (color) {
          data.cell.styles.textColor = color;
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  // --- Trigger download ---
  const today = new Date().toISOString().split("T")[0];
  const filename = `${reportName.replace(/\s+/g, "-").toLowerCase()}-${today}.pdf`;
  doc.save(filename);
}
