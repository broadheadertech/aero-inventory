"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Check, Loader2 } from "lucide-react";

export function AllocationWizard() {
  const { toast } = useToast();
  const [selectedProductId, setSelectedProductId] = useState("");
  const [totalQuantity, setTotalQuantity] = useState<number>(0);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [adjustedQtys, setAdjustedQtys] = useState<Record<string, number>>({});
  const [isConfirming, setIsConfirming] = useState(false);

  const confirmAllocation = useMutation(api.mutations.confirmAllocation.confirmAllocation);

  const products = useQuery(api.queries.listProductsByDepartment.listProductsByDepartment, {});
  const warehouseStock = useQuery(api.queries.getWarehouseStock.getWarehouseStock);

  // Get warehouse SOH for selected product
  const warehouseSOH = selectedProductId && warehouseStock?.items
    ? warehouseStock.items.find((i) => i.productId === selectedProductId)?.currentSOH ?? 0
    : 0;

  const recommendations = useQuery(
    api.queries.getAllocationRecommendation.getAllocationRecommendation,
    showRecommendations && selectedProductId && totalQuantity > 0
      ? {
          productId: selectedProductId as Id<"products">,
          totalQuantity,
        }
      : "skip"
  );

  const selectedProduct = products?.find((p) => p._id === selectedProductId);

  // Initialize adjusted quantities from recommendations
  useEffect(() => {
    if (recommendations) {
      const initial: Record<string, number> = {};
      for (const rec of recommendations) {
        initial[rec.branchId] = rec.recommendedQty;
      }
      setAdjustedQtys(initial);
    }
  }, [recommendations]);

  const totalAdjusted = Object.values(adjustedQtys).reduce((sum, q) => sum + q, 0);
  const remaining = totalQuantity - totalAdjusted;

  const handleConfirm = async () => {
    if (!recommendations || remaining !== 0) return;
    setIsConfirming(true);
    try {
      await confirmAllocation({
        productId: selectedProductId as Id<"products">,
        totalQuantity,
        allocations: recommendations.map((rec) => ({
          branchId: rec.branchId,
          adjustedQty: adjustedQtys[rec.branchId] ?? rec.recommendedQty,
          recommendedQty: rec.recommendedQty,
          sellThruRate: rec.sellThruRate,
        })),
      });
      toast({ title: "Allocation confirmed — transfer requests created" });
      setShowRecommendations(false);
      setSelectedProductId("");
      setTotalQuantity(0);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to confirm",
        variant: "destructive",
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleGenerate = () => {
    if (selectedProductId && totalQuantity > 0) {
      setShowRecommendations(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Product + Quantity */}
      <div className="rounded-md border p-4 space-y-4">
        <h3 className="font-medium">Step 1: Select Product & Quantity</h3>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Product</label>
            <Select
              value={selectedProductId || "none"}
              onValueChange={(v) => {
                setSelectedProductId(v === "none" ? "" : v);
                setShowRecommendations(false);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select product to allocate..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select a product</SelectItem>
                {products?.map((p) => (
                  <SelectItem key={p._id} value={p._id}>
                    {p.styleCode} — {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-40">
            <label className="text-sm font-medium mb-1 block">Total Qty</label>
            <Input
              type="number"
              min={1}
              max={warehouseSOH || undefined}
              value={totalQuantity || ""}
              onChange={(e) => {
                setTotalQuantity(Number(e.target.value));
                setShowRecommendations(false);
              }}
              placeholder="e.g. 500"
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={!selectedProductId || totalQuantity <= 0 || totalQuantity > warehouseSOH}
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            Generate
          </Button>
        </div>
        {selectedProduct && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              {selectedProduct.department} / {selectedProduct.category} / {selectedProduct.collection}
            </span>
            <span className={`font-medium ${warehouseSOH > 0 ? "text-green-600" : "text-red-600"}`}>
              Warehouse SOH: {warehouseSOH}
            </span>
            {totalQuantity > warehouseSOH && totalQuantity > 0 && (
              <span className="text-red-600 text-xs font-medium">
                Exceeds available stock by {totalQuantity - warehouseSOH}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Recommendations */}
      {showRecommendations && (
        <div className="rounded-md border p-4 space-y-4">
          <h3 className="font-medium">Step 2: Allocation Recommendations</h3>
          {recommendations === undefined ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : recommendations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active branches found for allocation.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch</TableHead>
                  <TableHead className="text-right">Sell-Thru Rate</TableHead>
                  <TableHead className="text-right">Current SOH</TableHead>
                  <TableHead className="text-right">Recommended</TableHead>
                  <TableHead className="text-right">Adjusted Qty</TableHead>
                  <TableHead>Justification</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recommendations.map((rec) => (
                  <TableRow key={rec.branchId}>
                    <TableCell className="font-medium">{rec.branchName}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="secondary"
                        className={
                          rec.sellThruRate > 5
                            ? "bg-green-100 text-green-800"
                            : rec.sellThruRate > 0
                              ? "bg-amber-100 text-amber-800"
                              : "bg-gray-100 text-gray-800"
                        }
                      >
                        {rec.sellThruRate}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{rec.currentSOH}</TableCell>
                    <TableCell className="text-right">
                      {rec.recommendedQty}
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min={0}
                        className="w-20 ml-auto text-right"
                        value={adjustedQtys[rec.branchId] ?? rec.recommendedQty}
                        onChange={(e) =>
                          setAdjustedQtys((prev) => ({
                            ...prev,
                            [rec.branchId]: Number(e.target.value),
                          }))
                        }
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {rec.justification}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="flex items-center justify-between border-t pt-3">
            <div className="text-sm">
              <span>Total: {totalAdjusted} / {totalQuantity}</span>
              {remaining !== 0 && (
                <span className={`ml-2 font-medium ${remaining > 0 ? "text-amber-600" : "text-red-600"}`}>
                  ({remaining > 0 ? `${remaining} remaining` : `${Math.abs(remaining)} over-allocated`})
                </span>
              )}
              {remaining === 0 && (
                <span className="ml-2 text-green-600 font-medium">Balanced</span>
              )}
            </div>
            <Button
              onClick={handleConfirm}
              disabled={isConfirming || remaining !== 0}
            >
              {isConfirming ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Confirm Allocation
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Algorithm: v1_weighted_avg. Adjust quantities as needed — total must match before confirming.
          </p>
        </div>
      )}
    </div>
  );
}
