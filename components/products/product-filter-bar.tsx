"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Doc } from "@/convex/_generated/dataModel";

export interface ProductFilters {
  search: string;
  department: string;
  category: string;
  collection: string;
  color: string;
  class: string;
}

interface ProductFilterBarProps {
  filters: ProductFilters;
  onChange: (filters: ProductFilters) => void;
  /** Used to derive unique option values for dropdowns */
  products: Doc<"products">[];
}

function unique(arr: string[]): string[] {
  return [...new Set(arr)].sort();
}

export function ProductFilterBar({
  filters,
  onChange,
  products,
}: ProductFilterBarProps) {
  const departments = unique(products.map((p) => p.department));
  const categories = unique(products.map((p) => p.category));
  const collections = unique(products.map((p) => p.collection));
  const colors = unique(products.map((p) => p.color));
  const classes = unique(products.flatMap((p) => (p.class ? [p.class] : [])));

  const hasFilters =
    filters.search ||
    filters.department ||
    filters.category ||
    filters.collection ||
    filters.color ||
    filters.class;

  function set(key: keyof ProductFilters, value: string) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search style code or description..."
        value={filters.search}
        onChange={(e) => set("search", e.target.value)}
        className="max-w-sm"
        aria-label="Search products"
      />
      <div className="flex flex-wrap gap-2 items-center">
        {/* Department */}
        <Select
          value={filters.department || "all"}
          onValueChange={(v) => set("department", v === "all" || !v ? "" : v)}
        >
          <SelectTrigger className="w-40">
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

        {/* Category */}
        <Select
          value={filters.category || "all"}
          onValueChange={(v) => set("category", v === "all" || !v ? "" : v)}
        >
          <SelectTrigger className="w-40">
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

        {/* Collection */}
        <Select
          value={filters.collection || "all"}
          onValueChange={(v) => set("collection", v === "all" || !v ? "" : v)}
        >
          <SelectTrigger className="w-40">
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

        {/* Color */}
        <Select
          value={filters.color || "all"}
          onValueChange={(v) => set("color", v === "all" || !v ? "" : v)}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Color" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Colors</SelectItem>
            {colors.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Class — only show when products have class values */}
        {classes.length > 0 && (
          <Select
            value={filters.class || "all"}
            onValueChange={(v) => set("class", v === "all" || !v ? "" : v)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onChange({
                search: "",
                department: "",
                category: "",
                collection: "",
                color: "",
                class: "",
              })
            }
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
