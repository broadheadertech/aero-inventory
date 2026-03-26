"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Id, Doc } from "@/convex/_generated/dataModel";

type WarehouseStockResult = {
  warehouse: Doc<"branches">;
  items: Array<{
    _id: Id<"branchProducts">;
    branchId: Id<"branches">;
    productId: Id<"products">;
    beginningStock: number;
    currentSOH: number;
    product: Doc<"products"> | null;
  }>;
} | null;

type Product = Doc<"products">;
type Branch = Doc<"branches">;

export default function WarehousePage() {
  const stockResult = useQuery(
    api.queries.getWarehouseStock.getWarehouseStock
  ) as WarehouseStockResult | undefined;

  const products = useQuery(api.queries.listProducts.listProducts) as
    | Product[]
    | undefined;

  const branches = useQuery(
    api.queries.listActiveBranches.listActiveBranches
  ) as Branch[] | undefined;

  const recordInbound = useMutation(
    api.mutations.recordWarehouseInbound.recordWarehouseInbound
  );

  const allocateStock = useMutation(
    api.mutations.allocateWarehouseStock.allocateWarehouseStock
  );

  // --- Record Inbound state ---
  const [inboundSheetOpen, setInboundSheetOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Search state ---
  const [search, setSearch] = useState("");

  // --- Allocate to Branch state ---
  const [allocateSheetOpen, setAllocateSheetOpen] = useState(false);
  const [allocateProductId, setAllocateProductId] = useState<string>("");
  const [allocateBranchId, setAllocateBranchId] = useState<string>("");
  const [allocateQty, setAllocateQty] = useState("");
  const [allocateError, setAllocateError] = useState<string | null>(null);
  const [allocateSubmitting, setAllocateSubmitting] = useState(false);

  const isLoading = stockResult === undefined;
  const items = stockResult?.items ?? [];

  // Destination branches: active, non-warehouse
  const destinationBranches = (branches ?? []).filter(
    (b) => b.type !== "warehouse"
  );

  // Selected product's available SOH for allocation
  const selectedWarehouseItem = items.find(
    (i) => i.productId === (allocateProductId as Id<"products">)
  );
  const availableSOH = selectedWarehouseItem?.currentSOH ?? 0;

  async function handleInboundSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const qty = parseInt(quantity, 10);
    if (!selectedProductId || isNaN(qty) || qty <= 0) {
      setError("Select a product and enter a valid quantity.");
      return;
    }
    setSubmitting(true);
    try {
      await recordInbound({
        productId: selectedProductId as Id<"products">,
        quantity: qty,
      });
      toast.success("Inbound stock recorded.");
      setSelectedProductId("");
      setQuantity("");
      setInboundSheetOpen(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to record inbound."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAllocateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAllocateError(null);
    const qty = parseInt(allocateQty, 10);
    if (!allocateProductId) {
      setAllocateError("Select a product.");
      return;
    }
    if (!allocateBranchId) {
      setAllocateError("Select a destination branch.");
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      setAllocateError("Enter a valid quantity.");
      return;
    }
    if (qty > availableSOH) {
      setAllocateError(`Warehouse stock insufficient (${availableSOH} available).`);
      return;
    }
    setAllocateSubmitting(true);
    try {
      const branchName = await allocateStock({
        productId: allocateProductId as Id<"products">,
        destinationBranchId: allocateBranchId as Id<"branches">,
        quantity: qty,
      });
      toast.success(`Stock allocated to ${branchName}.`);
      setAllocateProductId("");
      setAllocateBranchId("");
      setAllocateQty("");
      setAllocateSheetOpen(false);
    } catch (err) {
      setAllocateError(
        err instanceof Error ? err.message : "Failed to allocate stock."
      );
    } finally {
      setAllocateSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Warehouse</h1>
          <p className="text-sm text-muted-foreground">
            {stockResult?.warehouse
              ? stockResult.warehouse.name
              : "Central warehouse stock management"}
          </p>
        </div>
        {!isLoading && stockResult && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setAllocateSheetOpen(true)}
              disabled={items.length === 0}
            >
              Allocate to Branch
            </Button>
            <Button onClick={() => setInboundSheetOpen(true)}>
              Record Inbound
            </Button>
          </div>
        )}
      </div>

      {/* Record Inbound Sheet */}
      <Sheet open={inboundSheetOpen} onOpenChange={setInboundSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Record Inbound Stock</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleInboundSubmit} className="mt-6 space-y-4">
            <div className="space-y-1">
              <Label htmlFor="product">
                Product <span aria-hidden="true">*</span>
              </Label>
              <Select
                value={selectedProductId}
                onValueChange={(val) => setSelectedProductId(val ?? "")}
              >
                <SelectTrigger id="product">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {(products ?? [])
                    .filter((p) => p.isActive)
                    .map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.styleCode} — {p.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="quantity">
                Quantity <span aria-hidden="true">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                placeholder="e.g. 50"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Saving..." : "Record Inbound"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Allocate to Branch Sheet */}
      <Sheet
        open={allocateSheetOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAllocateProductId("");
            setAllocateBranchId("");
            setAllocateQty("");
            setAllocateError(null);
          }
          setAllocateSheetOpen(open);
        }}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Allocate to Branch</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleAllocateSubmit} className="mt-6 space-y-4">
            <div className="space-y-1">
              <Label htmlFor="allocate-product">
                Product <span aria-hidden="true">*</span>
              </Label>
              <Select
                value={allocateProductId}
                onValueChange={(val) => {
                  setAllocateProductId(val ?? "");
                  setAllocateQty("");
                }}
              >
                <SelectTrigger id="allocate-product">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {items
                    .filter((i) => i.product && i.currentSOH > 0)
                    .sort((a, b) =>
                      (a.product?.styleCode ?? "").localeCompare(
                        b.product?.styleCode ?? ""
                      )
                    )
                    .map((i) => (
                      <SelectItem key={i.productId} value={i.productId}>
                        {i.product?.styleCode} — {i.product?.name} (SOH:{" "}
                        {i.currentSOH})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="allocate-branch">
                Destination Branch <span aria-hidden="true">*</span>
              </Label>
              <Select
                value={allocateBranchId}
                onValueChange={(val) => setAllocateBranchId(val ?? "")}
              >
                <SelectTrigger id="allocate-branch">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {destinationBranches.map((b) => (
                    <SelectItem key={b._id} value={b._id}>
                      {b.name} ({b.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="allocate-qty">
                Quantity <span aria-hidden="true">*</span>
              </Label>
              <Input
                id="allocate-qty"
                type="number"
                min={1}
                max={availableSOH || undefined}
                placeholder="e.g. 10"
                value={allocateQty}
                onChange={(e) => setAllocateQty(e.target.value)}
                disabled={!allocateProductId}
              />
              {allocateProductId && (
                <p className="text-xs text-muted-foreground">
                  Available: {availableSOH}
                </p>
              )}
            </div>
            {allocateError && (
              <p className="text-sm text-destructive">{allocateError}</p>
            )}
            <Button
              type="submit"
              disabled={allocateSubmitting}
              className="w-full"
            >
              {allocateSubmitting ? "Allocating..." : "Allocate Stock"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : !stockResult ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-sm font-medium">No warehouse configured</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a location with type &quot;Warehouse&quot; in the Branches
            section to get started.
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No stock recorded yet. Use &quot;Record Inbound&quot; to add items.
          </p>
        </div>
      ) : (
        <>
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by style code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Style Code</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Beginning Stock</TableHead>
                <TableHead className="text-right">Current SOH</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items
                .filter((i) => {
                  if (!i.product) return false;
                  if (!search) return true;
                  const q = search.toLowerCase();
                  return (
                    i.product?.styleCode?.toLowerCase().includes(q) ||
                    i.product?.name?.toLowerCase().includes(q)
                  );
                })
                .sort((a, b) =>
                  (a.product?.styleCode ?? "").localeCompare(
                    b.product?.styleCode ?? ""
                  )
                )
                .map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center gap-2">
                        {item.product?.imageUrl ? (
                          <img src={item.product.imageUrl} alt="" className="h-8 w-8 rounded object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-[10px] font-medium text-muted-foreground">
                            {(item.product?.styleCode ?? "").slice(-3)}
                          </div>
                        )}
                        {item.product?.styleCode}
                      </div>
                    </TableCell>
                    <TableCell>{item.product?.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {item.product?.department}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.beginningStock}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {item.currentSOH}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
        </>
      )}
    </div>
  );
}
