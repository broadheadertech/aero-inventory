"use client";

import { Fragment, useState } from "react";
import type { SellThruRow, SellThruNetworkRow } from "@/lib/types/sell-thru";
import { ClassificationBadge } from "./classification-badge";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

const rowTintMap: Record<SellThruRow["classification"], string> = {
  Fast: "bg-fast-bg/50 hover:bg-fast-bg",
  Mid: "bg-mid-bg/50 hover:bg-mid-bg",
  Slow: "bg-slow-bg/50 hover:bg-slow-bg",
  "N/A": "hover:bg-muted/50",
};

interface SellThruTableProps {
  rows: (SellThruRow | SellThruNetworkRow)[];
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  sortColumn?: string;
  sortDirection?: "asc" | "desc" | "default";
  onSort?: (col: string) => void;
  showBranch?: boolean;
}

function SortableHeader({
  column,
  label,
  title,
  sortColumn,
  sortDirection,
  onSort,
  align = "left",
}: {
  column: string;
  label: string;
  title?: string;
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
      aria-sort={ariaSort}
      title={title}
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

function getAgeClassName(weeksOnFloor: number | null): string {
  if (weeksOnFloor === null) return "";
  if (weeksOnFloor >= 16) return "text-destructive font-semibold";
  if (weeksOnFloor >= 8) return "text-amber-600";
  return "";
}

function getDsiClassName(dsi: number | null): string {
  if (dsi === null) return "";
  if (dsi < 7) return "text-destructive font-semibold";
  return "";
}

function getMiClassName(mi: number | null): string {
  if (mi === null) return "";
  if (mi > 100) return "text-green-600 font-medium";
  if (mi < 80) return "text-destructive";
  return "";
}

export function SellThruTable({
  rows,
  expandedId,
  onToggleExpand,
  sortColumn,
  sortDirection,
  onSort,
  showBranch = false,
}: SellThruTableProps) {
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
        No sell-thru data available. Assign products and log sales to see performance.
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
                align="left"
              />
            )}
            <SortableHeader
              column="styleCode"
              label="Style Code"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={onSort}
              align="left"
            />
            <SortableHeader
              column="productName"
              label="Description"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={onSort}
              align="left"
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
              column="classification"
              label="Classification"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={onSort}
              align="center"
            />
            <SortableHeader
              column="weeksOnFloor"
              label="Age"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={onSort}
              align="right"
            />
            <SortableHeader
              column="ads"
              label="ADS"
              title="Average Daily Sales (total sold ÷ days since delivery date)"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={onSort}
              align="right"
            />
            <SortableHeader
              column="dsi"
              label="DSI"
              title="Days of Stock on Hand (days until stockout at current sales rate)"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={onSort}
              align="right"
            />
            <SortableHeader
              column="mi"
              label="MI"
              title="Merchandise Index (product sell-thru vs category average; 100 = average)"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={onSort}
              align="right"
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((row) => {
            const isExpanded = expandedId === row.branchProductId;
            const tint = rowTintMap[row.classification] ?? "hover:bg-muted/50";

            return (
              <Fragment key={row.branchProductId}>
                <TableRow
                  onClick={() => onToggleExpand(row.branchProductId)}
                  className={`border-b transition-colors cursor-pointer ${tint}`}
                >
                  {showBranch && (
                    <TableCell className="px-3 py-2 text-sm max-w-30 truncate">
                      {"branchName" in row ? row.branchName : "—"}
                    </TableCell>
                  )}
                  <TableCell className="px-3 py-2 font-mono text-sm font-medium">
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
                  <TableCell className="px-3 py-2 text-right tabular-nums">{row.beginningStock}</TableCell>
                  <TableCell className="px-3 py-2 text-right tabular-nums">{row.sold}</TableCell>
                  <TableCell className="px-3 py-2 text-right tabular-nums">{row.currentSOH}</TableCell>
                  <TableCell className="px-3 py-2 text-right tabular-nums">
                    {row.sellThruPercent !== null ? (
                      `${row.sellThruPercent}%`
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-center">
                    <ClassificationBadge classification={row.classification} />
                  </TableCell>
                  <TableCell className={cn("px-3 py-2 text-right tabular-nums", getAgeClassName(row.weeksOnFloor))}>
                    {row.weeksOnFloor !== null ? `${row.weeksOnFloor}w` : "—"}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-right tabular-nums">
                    {row.ads !== null ? (
                      `${row.ads.toFixed(1)}/day`
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className={cn("px-3 py-2 text-right tabular-nums", getDsiClassName(row.dsi))}>
                    {row.dsi !== null ? (
                      `${row.dsi.toFixed(1)} days`
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className={cn("px-3 py-2 text-right tabular-nums", getMiClassName(row.mi))}>
                    {row.mi !== null ? (
                      row.mi
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow className="border-b bg-muted/20">
                    <TableCell colSpan={showBranch ? 12 : 11} className="p-0">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 text-sm">
                        <div>
                          <span className="font-medium">Delivery Date:</span>{" "}
                          <span className="text-muted-foreground">{row.deliveryInStoreDate ?? "—"}</span>
                        </div>
                        <div>
                          <span className="font-medium">Weeks on Floor:</span>{" "}
                          <span className="text-muted-foreground">
                            {row.weeksOnFloor !== null ? `${row.weeksOnFloor}w` : "—"}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Beginning Stock:</span>{" "}
                          <span className="tabular-nums">{row.beginningStock}</span>
                        </div>
                        <div>
                          <span className="font-medium">Current SOH:</span>{" "}
                          <span className="tabular-nums">{row.currentSOH}</span>
                        </div>
                        <div>
                          <span className="font-medium">Units Sold:</span>{" "}
                          <span className="tabular-nums">{row.sold}</span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
    </div>
  );
}
