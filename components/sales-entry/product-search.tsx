"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Doc } from "@/convex/_generated/dataModel";

type RawBranchProduct = Doc<"branchProducts"> & {
  product: Doc<"products"> | null;
};

export type BranchProductSearchResult = {
  branchProductId: string;
  branchId: string;
  productId: string;
  styleCode: string;
  name: string;
  retailPrice: number; // centavos
  currentSOH: number;
  beginningStock: number;
};

interface ProductSearchProps {
  onSelect: (item: BranchProductSearchResult) => void;
}

export function ProductSearch({ onSelect }: ProductSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const rawBranchProducts = useQuery(
    api.queries.listMyBranchProducts.listMyBranchProducts
  );

  // Auto-focus on mount (AC: 1)
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Map the raw query result (branchProduct + nested product) to flat search result shape
  const branchProducts: BranchProductSearchResult[] | undefined =
    (rawBranchProducts as RawBranchProduct[] | undefined)?.flatMap((bp) => {
      if (!bp.product || !bp.product.isActive) return [];
      return [
        {
          branchProductId: bp._id,
          branchId: bp.branchId,
          productId: bp.productId,
          styleCode: bp.product.styleCode,
          name: bp.product.name,
          retailPrice: bp.product.retailPrice,
          currentSOH: bp.currentSOH,
          beginningStock: bp.beginningStock,
        },
      ];
    });

  const results: BranchProductSearchResult[] =
    query.length >= 3 && branchProducts
      ? branchProducts.filter(
          (bp) =>
            bp.styleCode.toLowerCase().includes(query.toLowerCase()) ||
            bp.name.toLowerCase().includes(query.toLowerCase())
        )
      : [];

  const showDropdown = open && query.length >= 3;

  function handleSelect(item: BranchProductSearchResult) {
    if (item.currentSOH === 0) return; // Out of stock — cannot select
    onSelect(item);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="search"
        placeholder="Search by style code or name..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Delay to allow click on dropdown item to fire
          setTimeout(() => setOpen(false), 150);
        }}
        aria-label="Search products"
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        className="h-12 text-base" // 48px touch target
      />

      {/* Loading state */}
      {rawBranchProducts === undefined && query.length >= 3 && (
        <div className="absolute inset-x-0 top-full z-50 mt-1 space-y-1 rounded-md border bg-background p-2 shadow-md">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      )}

      {/* Results dropdown */}
      {showDropdown && rawBranchProducts !== undefined && (
        <ul
          role="listbox"
          aria-label="Product search results"
          className="absolute inset-x-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-md border bg-background shadow-md"
        >
          {results.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted-foreground">
              No products found for &lsquo;{query}&rsquo;
            </li>
          ) : (
            results.map((item) => {
              const outOfStock = item.currentSOH === 0;
              return (
                <li
                  key={item.branchProductId}
                  role="option"
                  aria-selected={false}
                  aria-disabled={outOfStock}
                  onClick={() => handleSelect(item)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between px-4 py-3",
                    "border-b last:border-b-0 transition-colors",
                    outOfStock
                      ? "cursor-not-allowed opacity-50"
                      : "hover:bg-accent"
                  )}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-sm font-medium">
                      {item.styleCode}
                    </span>
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {item.name}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                      outOfStock
                        ? "bg-destructive/10 text-destructive"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {outOfStock ? "Out of Stock" : `SOH: ${item.currentSOH}`}
                  </span>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
