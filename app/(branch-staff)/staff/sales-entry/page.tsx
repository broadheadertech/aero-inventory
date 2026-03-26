"use client";

import { useState } from "react";
import { ProductSearch } from "@/components/sales-entry/product-search";
import { SalesEntryForm } from "@/components/sales-entry/sales-entry-form";
import { SalesHistoryList } from "@/components/sales-entry/sales-history-list";
import type { BranchProductSearchResult } from "@/components/sales-entry/product-search";
import { ShoppingBag } from "lucide-react";

export default function SalesEntryPage() {
  const [selectedProduct, setSelectedProduct] =
    useState<BranchProductSearchResult | null>(null);
  const [todayCount, setTodayCount] = useState(0);

  function handleProductSelect(product: BranchProductSearchResult) {
    setSelectedProduct(product);
  }

  function handleSaleSuccess() {
    setTodayCount((prev) => prev + 1);
    setSelectedProduct(null);
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header with today counter */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight md:text-2xl">Sales Entry</h1>
          <p className="text-xs text-muted-foreground md:text-sm">Search and log product sales</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 md:px-4 md:py-2">
          <ShoppingBag className="h-4 w-4 text-primary md:h-5 md:w-5" />
          <span className="text-sm font-bold text-primary tabular-nums md:text-lg">{todayCount}</span>
          <span className="text-xs text-muted-foreground">today</span>
        </div>
      </div>

      {/* Desktop: two-column layout */}
      <div className="flex flex-col gap-4 md:flex-row md:gap-6">
        {/* Left: search + form */}
        <div className="flex flex-col gap-4 md:w-1/2 md:max-w-lg">
          <ProductSearch onSelect={handleProductSelect} />
          {selectedProduct !== null && (
            <SalesEntryForm
              product={selectedProduct}
              onSuccess={handleSaleSuccess}
            />
          )}
        </div>

        {/* Right: recent sales */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">Recent Sales</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <SalesHistoryList />
        </div>
      </div>
    </div>
  );
}
