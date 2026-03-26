export type ExportColumnType = "string" | "number" | "percent" | "currency" | "date";

export type ExportColumn = {
  header: string;
  key: string;
  type: ExportColumnType;
};

export type ReportExportConfig = {
  reportName: string;
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
  filters?: Record<string, string>;
  dateRange?: string;
  timePeriod?: string;
};

export type ExcelExportConfig = ReportExportConfig;
export type PdfExportConfig = ReportExportConfig;
