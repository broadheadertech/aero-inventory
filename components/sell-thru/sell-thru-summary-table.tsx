"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ClassificationBadge } from "./classification-badge";
import type { SellThruRow, SellThruNetworkRow } from "@/lib/types/sell-thru";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

// ─── Helpers ────────────────────────────────────────────────────────────────

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" });

function formatCurrency(centavos: number): string {
  return currencyFormatter.format(centavos / 100);
}

const agingPolicyMap: Record<string, string> = {
  Fast: "Normal",
  Mid: "Monitor",
  Slow: "Markdown",
  "N/A": "—",
};


function getAgeClassName(weeksOnFloor: number | null): string {
  if (weeksOnFloor === null) return "";
  if (weeksOnFloor >= 16) return "text-destructive font-semibold";
  if (weeksOnFloor >= 8) return "text-amber-600";
  return "";
}

// ─── SortableHeader ─────────────────────────────────────────────────────────

function SortableHeader({
  column,
  label,
  sortColumn,
  sortDirection,
  onSort,
  align = "left",
}: {
  column: string;
  label: string;
  sortColumn?: string;
  sortDirection?: "asc" | "desc" | "default";
  onSort?: (col: string) => void;
  align?: "left" | "right" | "center";
}) {
  const isActive = sortColumn === column;
  const ariaSort: "ascending" | "descending" | "none" =
    isActive && sortDirection === "asc"
      ? "ascending"
      : isActive && sortDirection === "desc"
        ? "descending"
        : "none";

  const indicator =
    isActive && sortDirection === "asc"
      ? " ▲"
      : isActive && sortDirection === "desc"
        ? " ▼"
        : "";

  return (
    <TableHead
      scope="col"
      aria-sort={ariaSort}
      tabIndex={0}
      onClick={() => onSort?.(column)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSort?.(column);
        }
      }}
      className={cn(
        "px-3 py-2 text-xs font-medium text-muted-foreground cursor-pointer select-none hover:bg-muted/80 transition-colors whitespace-nowrap",
        align === "right" && "text-right",
        align === "center" && "text-center",
        align === "left" && "text-left"
      )}
    >
      {label}{indicator}
    </TableHead>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

interface SellThruSummaryTableProps {
  rows: SellThruRow[] | SellThruNetworkRow[];
  showBranch?: boolean;
  onBranchClick?: (branchId: string, branchName: string) => void;
  sortColumn?: string;
  sortDirection?: "asc" | "desc" | "default";
  onSort?: (col: string) => void;
}

export function SellThruSummaryTable({
  rows,
  showBranch = false,
  onBranchClick,
  sortColumn,
  sortDirection,
  onSort,
}: SellThruSummaryTableProps) {
  const [search, setSearch] = useState("");

  const filtered = rows.filter((row) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      row.styleCode?.toLowerCase().includes(q) ||
      row.productName?.toLowerCase().includes(q)
    );
  });

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
        No sell-thru data available.
      </div>
    );
  }

  return (
    <div className="space-y-4">
    <div className="relative max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search by style code or name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="pl-9"
      />
    </div>
    <div className="overflow-x-auto rounded-lg border">
      <Table className="w-full text-sm">
        <TableHeader>
          <TableRow className="bg-muted border-b">
            {showBranch && (
              <SortableHeader
                column="branchName"
                label="Branch"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={onSort}
              />
            )}
            <SortableHeader
              column="age"
              label="AGE"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={onSort}
              align="right"
            />
            <SortableHeader
              column="agingPolicy"
              label="Aging Policy"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <SortableHeader
              column="deliveryInStoreDate"
              label="Delivery in Store"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <SortableHeader
              column="weeksOnFloor"
              label="No. of Weeks"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={onSort}
              align="right"
            />
            <SortableHeader
              column="styleCode"
              label="Style Code"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <SortableHeader
              column="productName"
              label="Description"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <SortableHeader
              column="beginningStock"
              label="BEG"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={onSort}
              align="right"
            />
            <SortableHeader
              column="sold"
              label="SOLD"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={onSort}
              align="right"
            />
            <SortableHeader
              column="currentSOH"
              label="SOH"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={onSort}
              align="right"
            />
            <SortableHeader
              column="sellThruPercent"
              label="Sell-Thru %"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={onSort}
              align="right"
            />
            <SortableHeader
              column="remarks"
              label="Remarks"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <SortableHeader
              column="retailPrice"
              label="SRP"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={onSort}
              align="right"
            />
            <SortableHeader
              column="currentSrp"
              label="Current SRP"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={onSort}
              align="right"
            />
            <SortableHeader
              column="margin"
              label="Actual Product Margin"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={onSort}
              align="right"
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((row) => {
            const age = row.weeksOnFloor !== null ? `${row.weeksOnFloor}w` : "—";
            const agingPolicy = agingPolicyMap[row.classification] ?? "—";
            const deliveryDisplay = row.deliveryInStoreDate
              ? dateFormatter.format(new Date(row.deliveryInStoreDate))
              : "—";
            const remarks = row.remark;
            const srp = row.retailPrice > 0 ? formatCurrency(row.retailPrice) : "—";
            const margin =
              row.retailPrice > 0
                ? formatCurrency(row.retailPrice - row.unitCost)
                : "—";

            return (
              <TableRow
                key={row.branchProductId}
                className="border-b hover:bg-muted/50 transition-colors"
              >
                {showBranch && (
                  <TableCell className="px-3 py-2 whitespace-nowrap text-sm">
                    <button
                      type="button"
                      onClick={() =>
                        onBranchClick?.(
                          (row as SellThruNetworkRow).branchId as string,
                          (row as SellThruNetworkRow).branchName
                        )
                      }
                      className="font-medium hover:underline text-primary focus:outline-none focus:ring-1 focus:ring-ring rounded"
                    >
                      {(row as SellThruNetworkRow).branchName}
                    </button>
                  </TableCell>
                )}
                <TableCell
                  className={cn(
                    "px-3 py-2 text-right tabular-nums whitespace-nowrap",
                    getAgeClassName(row.weeksOnFloor)
                  )}
                >
                  {age}
                </TableCell>
                <TableCell className="px-3 py-2 whitespace-nowrap">{agingPolicy}</TableCell>
                <TableCell className="px-3 py-2 whitespace-nowrap">{deliveryDisplay}</TableCell>
                <TableCell className="px-3 py-2 text-right tabular-nums whitespace-nowrap">
                  {row.weeksOnFloor !== null ? row.weeksOnFloor : "—"}
                </TableCell>
                <TableCell className="px-3 py-2 font-mono whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {row.imageUrl ? (
                      <img src={row.imageUrl} alt="" className="h-8 w-8 rounded object-cover" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-[10px] font-medium text-muted-foreground">
                        {row.styleCode.slice(-3)}
                      </div>
                    )}
                    {row.styleCode}
                  </div>
                </TableCell>
                <TableCell className="px-3 py-2 max-w-[180px] truncate">{row.productName}</TableCell>
                <TableCell className="px-3 py-2 text-right tabular-nums whitespace-nowrap">
                  {row.beginningStock}
                </TableCell>
                <TableCell className="px-3 py-2 text-right tabular-nums whitespace-nowrap">
                  {row.sold}
                </TableCell>
                <TableCell className="px-3 py-2 text-right tabular-nums whitespace-nowrap">
                  {row.currentSOH}
                </TableCell>
                <TableCell className="px-3 py-2 text-right whitespace-nowrap">
                  <span className="tabular-nums">
                    {row.sellThruPercent !== null ? `${row.sellThruPercent}%` : "N/A"}
                  </span>{" "}
                  <ClassificationBadge classification={row.classification} />
                </TableCell>
                <TableCell className="px-3 py-2 whitespace-nowrap text-sm text-muted-foreground">
                  {remarks}
                </TableCell>
                <TableCell className="px-3 py-2 text-right tabular-nums whitespace-nowrap">
                  {srp}
                </TableCell>
                <TableCell className="px-3 py-2 text-right tabular-nums whitespace-nowrap">
                  {srp}
                </TableCell>
                <TableCell className="px-3 py-2 text-right tabular-nums whitespace-nowrap">
                  {margin}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
    </div>
  );
}
