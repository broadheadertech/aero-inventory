"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { SellThruTrendChart } from "@/components/trend-charts/sell-thru-trend-chart";
import { CategoryComparisonChart } from "@/components/trend-charts/category-comparison-chart";
import { TrajectoryIndicator } from "@/components/trend-charts/trajectory-indicator";
import { TrendFilters } from "@/components/trend-charts/trend-filters";
import { DecliningProductsTable } from "@/components/trend-charts/declining-products-table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminTrendsPage() {
  const [period, setPeriod] = useState("1m");
  const [branchId, setBranchId] = useState("");
  const [department, setDepartment] = useState("");
  const [category, setCategory] = useState("");
  const [collection, setCollection] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [decliningScope, setDecliningScope] = useState<"network" | "branch">("network");

  const trendData = useQuery(api.queries.getTrendData.getTrendData, {
    period,
    branchId: branchId ? (branchId as Id<"branches">) : undefined,
    department: department || undefined,
    category: category || undefined,
    collection: collection || undefined,
  });

  const comparisonData = useQuery(
    api.queries.getTrendComparison.getTrendComparison,
    selectedProductId
      ? {
          productId: selectedProductId as Id<"products">,
          branchId: branchId ? (branchId as Id<"branches">) : undefined,
          period,
        }
      : "skip"
  );

  const shouldSkipDeclining = decliningScope === "branch" && !branchId;
  const decliningBranchId = decliningScope === "branch" && branchId
    ? (branchId as Id<"branches">)
    : undefined;
  const decliningData = useQuery(
    api.queries.getDecliningSellThru.getDecliningSellThru,
    shouldSkipDeclining ? "skip" : { branchId: decliningBranchId, period }
  );

  const branches = useQuery(api.queries.listBranches.listBranches, {});
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
          Sell-thru performance trends across the network
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
        showBranchFilter
        branchId={branchId}
        onBranchIdChange={setBranchId}
        departments={departments}
        categories={categories}
        collections={collections}
        branches={branches?.map((b) => ({ _id: b._id, name: b.name }))}
      />

      {/* Product selector for comparison */}
      <div className="flex items-center gap-3">
        <Select
          value={selectedProductId || "none"}
          onValueChange={(v) => setSelectedProductId(v === "none" ? "" : v)}
        >
          <SelectTrigger className="w-[350px]">
            <SelectValue placeholder="Select product for comparison...">
              {selectedProduct
                ? `${selectedProduct.styleCode} — ${selectedProduct.name}`
                : "No product selected (aggregated view)"}
            </SelectValue>
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

      {/* Show comparison chart when product selected, aggregated chart otherwise */}
      {selectedProductId ? (
        <CategoryComparisonChart
          productTrend={comparisonData?.productTrend}
          categoryAvgTrend={comparisonData?.categoryAvgTrend}
          productName={selectedProduct?.styleCode}
        />
      ) : (
        <SellThruTrendChart data={trendData} />
      )}

      {/* Declining Products Section */}
      <div className="space-y-3 border-t pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Declining Products</h2>
            <p className="text-sm text-muted-foreground">
              Products with declining sell-thru velocity
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-md border p-1">
            <Button
              variant={decliningScope === "network" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setDecliningScope("network")}
            >
              Network
            </Button>
            <Button
              variant={decliningScope === "branch" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setDecliningScope("branch")}
            >
              Branch
            </Button>
          </div>
        </div>
        {decliningScope === "branch" && !branchId && (
          <p className="text-sm text-amber-600">
            Select a branch in the filters above to view branch-level declining products.
          </p>
        )}
        <DecliningProductsTable data={decliningData} />
      </div>
    </div>
  );
}
