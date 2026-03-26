"use client";

import { useMemo } from "react";
import { useSellThruStore } from "@/lib/stores/use-sell-thru-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { SellThruRow } from "@/lib/types/sell-thru";

interface SellThruFilterBarProps {
  rows: SellThruRow[];
  showClassificationSelect?: boolean;
}

const TIME_PERIOD_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
];

export function SellThruFilterBar({ rows, showClassificationSelect = false }: SellThruFilterBarProps) {
  const {
    department,
    category,
    collection,
    timePeriod,
    classificationFilter,
    setDepartment,
    setCategory,
    setCollection,
    setTimePeriod,
    setClassificationFilter,
    clearFilters,
  } = useSellThruStore();

  const departments = useMemo(
    () => [...new Set(rows.map((r) => r.department).filter(Boolean))].sort(),
    [rows]
  );

  const categories = useMemo(
    () => [...new Set(rows.map((r) => r.category).filter(Boolean))].sort(),
    [rows]
  );

  const collections = useMemo(
    () => [...new Set(rows.map((r) => r.collection).filter(Boolean))].sort(),
    [rows]
  );

  const hasActiveFilters = !!(
    department ||
    category ||
    collection ||
    timePeriod !== "weekly" ||
    classificationFilter
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3">
        {/* Department filter */}
        <Select
          value={department || "all"}
          onValueChange={(val) => setDepartment(val === "all" || !val ? "" : val)}
        >
          <SelectTrigger className="h-10 w-[160px]">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category filter */}
        <Select
          value={category || "all"}
          onValueChange={(val) => setCategory(val === "all" || !val ? "" : val)}
        >
          <SelectTrigger className="h-10 w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Collection filter */}
        <Select
          value={collection || "all"}
          onValueChange={(val) => setCollection(val === "all" || !val ? "" : val)}
        >
          <SelectTrigger className="h-10 w-[160px]">
            <SelectValue placeholder="Collection" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Collections</SelectItem>
            {collections.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Classification filter — only shown on reports page */}
        {showClassificationSelect && (
          <Select
            value={classificationFilter ?? "all"}
            onValueChange={(val) =>
              setClassificationFilter(
                val === "all" ? null : (val as "Fast" | "Mid" | "Slow")
              )
            }
          >
            <SelectTrigger className="h-10 w-40">
              <SelectValue placeholder="Classification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classifications</SelectItem>
              <SelectItem value="Fast">Fast</SelectItem>
              <SelectItem value="Mid">Mid</SelectItem>
              <SelectItem value="Slow">Slow</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Time Period filter */}
        <Select
          value={timePeriod}
          onValueChange={(val) => setTimePeriod(val ?? "weekly")}
        >
          <SelectTrigger className="h-10 w-[160px]">
            <SelectValue placeholder="Time Period" />
          </SelectTrigger>
          <SelectContent>
            {TIME_PERIOD_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {department && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium">
              Dept: {department}
              <button
                type="button"
                onClick={() => setDepartment("")}
                aria-label="Remove department filter"
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          )}
          {category && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium">
              Cat: {category}
              <button
                type="button"
                onClick={() => setCategory("")}
                aria-label="Remove category filter"
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          )}
          {collection && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium">
              Collection: {collection}
              <button
                type="button"
                onClick={() => setCollection("")}
                aria-label="Remove collection filter"
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          )}
          {timePeriod !== "weekly" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium">
              Period: {TIME_PERIOD_OPTIONS.find((o) => o.value === timePeriod)?.label ?? timePeriod}
              <button
                type="button"
                onClick={() => setTimePeriod("weekly")}
                aria-label="Remove time period filter"
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          )}
          {classificationFilter && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium">
              Classification: {classificationFilter}
              <button
                type="button"
                onClick={() => setClassificationFilter(null)}
                aria-label="Remove classification filter"
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs text-muted-foreground"
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
