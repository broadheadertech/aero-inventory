"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { AgingBracketRow } from "@/lib/types/aging-summary";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getAgeClassName(weeks: number | null): string {
  if (weeks === null) return "";
  if (weeks >= 16) return "text-destructive font-semibold";
  if (weeks >= 8) return "text-amber-600";
  return "";
}

// ─── Component ───────────────────────────────────────────────────────────────

interface AgingSummaryTableProps {
  rows: AgingBracketRow[];
  expandedRemark: string | null;
  onToggle: (remark: string) => void;
}

export function AgingSummaryTable({
  rows,
  expandedRemark,
  onToggle,
}: AgingSummaryTableProps) {
  const [search, setSearch] = useState("");

  const filteredRows = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows
      .map((row) => ({
        ...row,
        products: row.products.filter(
          (p) =>
            p.styleCode?.toLowerCase().includes(q) ||
            p.branchName?.toLowerCase().includes(q)
        ),
      }))
      .filter((row) => row.products.length > 0);
  }, [rows, search]);

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
        No aging data available.
      </div>
    );
  }

  return (
    <div className="space-y-4">
    <div className="relative max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search by style code or branch..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="pl-9"
      />
    </div>
    <div className="overflow-x-auto rounded-lg border">
      <Table className="w-full text-sm">
        <TableHeader>
          <TableRow className="bg-muted border-b">
            <TableHead colSpan={2} className="px-3 py-2 text-xs font-medium text-muted-foreground text-left whitespace-nowrap">
              Action
            </TableHead>
            <TableHead className="px-3 py-2 text-xs font-medium text-muted-foreground text-right whitespace-nowrap">
              Product Count
            </TableHead>
            <TableHead className="px-3 py-2 text-xs font-medium text-muted-foreground text-right whitespace-nowrap">
              Total SOH
            </TableHead>
            <TableHead className="px-3 py-2 text-xs font-medium text-muted-foreground text-right whitespace-nowrap">
              Avg Sell-Thru %
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRows.map((row) => {
            const isExpanded = expandedRemark === row.remark;
            const isNoAction = row.remark === "—";

            return (
              <React.Fragment key={row.remark}>
                {/* Bracket summary row */}
                <TableRow
                  onClick={() => onToggle(row.remark)}
                  className="border-b hover:bg-muted/50 cursor-pointer transition-colors select-none"
                >
                  <TableCell colSpan={2} className="px-3 py-2 whitespace-nowrap">
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-xs transition-transform duration-150 inline-block",
                          isExpanded && "rotate-90"
                        )}
                      >
                        ▶
                      </span>
                      <span
                        className={cn(
                          "font-medium",
                          isNoAction && "text-muted-foreground font-normal"
                        )}
                      >
                        {row.remark}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-2 text-right tabular-nums">
                    {row.productCount}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-right tabular-nums">
                    {row.totalSOH}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-right tabular-nums">
                    {row.avgSellThruPercent !== null
                      ? `${row.avgSellThruPercent}%`
                      : "—"}
                  </TableCell>
                </TableRow>

                {/* Expanded product detail rows */}
                {isExpanded && (
                  <>
                    {/* Sub-header */}
                    <TableRow className="bg-muted/60 border-b">
                      <TableHead className="px-3 py-1.5 pl-8 text-xs font-medium text-muted-foreground text-left whitespace-nowrap">
                        Style Code
                      </TableHead>
                      <TableHead className="px-3 py-1.5 text-xs font-medium text-muted-foreground text-left whitespace-nowrap">
                        Branch
                      </TableHead>
                      <TableHead className="px-3 py-1.5 text-xs font-medium text-muted-foreground text-right whitespace-nowrap">
                        Weeks on Floor
                      </TableHead>
                      <TableHead className="px-3 py-1.5 text-xs font-medium text-muted-foreground text-right whitespace-nowrap">
                        Sell-Thru %
                      </TableHead>
                      <TableHead className="px-3 py-1.5 text-xs font-medium text-muted-foreground text-right whitespace-nowrap">
                        SOH
                      </TableHead>
                    </TableRow>
                    {row.products.map((p) => (
                      <TableRow
                        key={p.branchProductId as string}
                        className="bg-muted/20 border-b"
                      >
                        <TableCell className="px-3 py-1.5 pl-8 font-mono text-xs whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt="" className="h-8 w-8 rounded object-cover" />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-[10px] font-medium text-muted-foreground">
                                {p.styleCode.slice(-3)}
                              </div>
                            )}
                            {p.styleCode}
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-1.5 text-sm whitespace-nowrap">
                          {p.branchName}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "px-3 py-1.5 text-right tabular-nums text-sm whitespace-nowrap",
                            getAgeClassName(p.weeksOnFloor)
                          )}
                        >
                          {p.weeksOnFloor !== null ? `${p.weeksOnFloor}w` : "—"}
                        </TableCell>
                        <TableCell className="px-3 py-1.5 text-right tabular-nums text-sm whitespace-nowrap">
                          {p.sellThruPercent !== null
                            ? `${p.sellThruPercent}%`
                            : "—"}
                        </TableCell>
                        <TableCell className="px-3 py-1.5 text-right tabular-nums text-sm whitespace-nowrap">
                          {p.currentSOH}
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
    </div>
  );
}
