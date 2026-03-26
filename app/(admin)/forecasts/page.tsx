"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ForecastCard } from "@/components/forecasts/forecast-card";

export default function ForecastsPage() {
  const products = useQuery(api.queries.listProducts.listProducts, {});
  const branches = useQuery(api.queries.listBranches.listBranches, {});
  const [selectedBranch, setSelectedBranch] = useState<string>("network");
  const [selectedProduct, setSelectedProduct] = useState<string>("");

  if (products === undefined || branches === undefined) {
    return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}</div>;
  }

  const branchId = selectedBranch !== "network" ? selectedBranch as Id<"branches"> : undefined;
  const filteredProducts = selectedProduct
    ? products.filter((p) => p._id === selectedProduct)
    : products.slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Demand Forecasts</h1>
        <p className="text-muted-foreground">Predicted sell-thru for the next 1-4 weeks</p>
      </div>

      <div className="flex gap-3">
        <Select value={selectedBranch} onValueChange={setSelectedBranch}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Scope" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="network">Network Level</SelectItem>
            {branches.map((b) => <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
          <SelectTrigger className="w-[250px]"><SelectValue placeholder="All Products (top 10)" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products (top 10)</SelectItem>
            {products.map((p) => <SelectItem key={p._id} value={p._id}>{p.name} ({p.sku})</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredProducts.map((p) => (
          <ForecastCard key={p._id} productId={p._id} branchId={branchId} />
        ))}
      </div>
    </div>
  );
}
