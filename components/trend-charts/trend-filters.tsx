"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

type TrendFiltersProps = {
  period: string;
  onPeriodChange: (period: string) => void;
  department: string;
  onDepartmentChange: (dept: string) => void;
  category: string;
  onCategoryChange: (cat: string) => void;
  collection: string;
  onCollectionChange: (col: string) => void;
  showBranchFilter?: boolean;
  branchId: string;
  onBranchIdChange?: (branchId: string) => void;
  departments: string[];
  categories: string[];
  collections: string[];
  branches?: { _id: string; name: string }[];
};

const PERIOD_OPTIONS = [
  { value: "1w", label: "1 Week" },
  { value: "1m", label: "1 Month" },
  { value: "3m", label: "3 Months" },
  { value: "6m", label: "6 Months" },
];

export function TrendFilters({
  period,
  onPeriodChange,
  department,
  onDepartmentChange,
  category,
  onCategoryChange,
  collection,
  onCollectionChange,
  showBranchFilter,
  branchId,
  onBranchIdChange,
  departments,
  categories,
  collections,
  branches,
}: TrendFiltersProps) {
  const handleReset = () => {
    onPeriodChange("1m");
    onDepartmentChange("");
    onCategoryChange("");
    onCollectionChange("");
    if (onBranchIdChange) onBranchIdChange("");
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={period} onValueChange={onPeriodChange}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Period" />
        </SelectTrigger>
        <SelectContent>
          {PERIOD_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showBranchFilter && branches && onBranchIdChange && (
        <Select value={branchId || "all"} onValueChange={(v) => onBranchIdChange(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Branches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {branches.map((b) => (
              <SelectItem key={b._id} value={b._id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select value={department || "all"} onValueChange={(v) => onDepartmentChange(v === "all" ? "" : v)}>
        <SelectTrigger className="w-[140px]">
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

      <Select value={category || "all"} onValueChange={(v) => onCategoryChange(v === "all" ? "" : v)}>
        <SelectTrigger className="w-[140px]">
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

      <Select value={collection || "all"} onValueChange={(v) => onCollectionChange(v === "all" ? "" : v)}>
        <SelectTrigger className="w-[140px]">
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

      <Button variant="ghost" size="sm" onClick={handleReset}>
        <RotateCcw className="mr-1 h-3 w-3" />
        Reset
      </Button>
    </div>
  );
}
