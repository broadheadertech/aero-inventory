"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { SellThruTrendChart } from "@/components/trend-charts/sell-thru-trend-chart";
import { CategoryComparisonChart } from "@/components/trend-charts/category-comparison-chart";
import { TrajectoryIndicator } from "@/components/trend-charts/trajectory-indicator";
import { TrendFilters } from "@/components/trend-charts/trend-filters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function BranchManagerTrendsPage() {
  const [period, setPeriod] = useState("1m");
  const [department, setDepartment] = useState("");
  const [category, setCategory] = useState("");
  const [collection, setCollection] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");

  const trendData = useQuery(api.queries.getTrendData.getTrendData, {
    period,
    department: department || undefined,
    category: category || undefined,
    collection: collection || undefined,
  });

  const comparisonData = useQuery(
    api.queries.getTrendComparison.getTrendComparison,
    selectedProductId
      ? { productId: selectedProductId as Id<"products">, period }
      : "skip"
  );

  const products = useQuery(api.queries.listProductsByDepartment.listProductsByDepartment, {});
  const selectedProduct = products?.find((p) => p._id === selectedProductId);

  const departments = useMemo(
    () => [...new Set(products?.map((p) => p.department) ?? [])].sort(),
    [products]
  );
  const categories = useMemo(
    () => [...new Set(products?.map((p) => p.category) ?? [])].sort(),
    [products]
  );
  const collections = useMemo(
    () => [...new Set(products?.map((p) => p.collection) ?? [])].sort(),
    [products]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trend Charts</h1>
        <p className="text-muted-foreground">
          Sell-thru performance trends for your branch
        </p>
      </div>

      <TrendFilters
        period={period}
        onPeriodChange={setPeriod}
        department={department}
        onDepartmentChange={setDepartment}
        category={category}
        onCategoryChange={setCategory}
        collection={collection}
        onCollectionChange={setCollection}
        branchId=""
        departments={departments}
        categories={categories}
        collections={collections}
      />

      <div className="flex items-center gap-3">
        <Select
          value={selectedProductId || "none"}
          onValueChange={(v) => setSelectedProductId(v === "none" ? "" : v)}
        >
          <SelectTrigger className="w-70">
            <SelectValue placeholder="Select product for comparison..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No product selected (aggregated view)</SelectItem>
            {products?.map((p) => (
              <SelectItem key={p._id} value={p._id}>
                {p.styleCode} — {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {comparisonData?.productTrend && comparisonData.productTrend.length >= 2 && (
          <TrajectoryIndicator trend={comparisonData.productTrend} />
        )}
      </div>

      {selectedProductId ? (
        <CategoryComparisonChart
          productTrend={comparisonData?.productTrend}
          categoryAvgTrend={comparisonData?.categoryAvgTrend}
          productName={selectedProduct?.styleCode}
        />
      ) : (
        <SellThruTrendChart data={trendData} />
      )}
    </div>
  );
}
