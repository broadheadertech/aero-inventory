"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AssignBranchProductForm,
  UpdateBranchProductForm,
} from "@/components/products/branch-product-form";
import type {
  AssignBranchProductFormValues,
  UpdateBranchProductFormValues,
} from "@/lib/validations/branch-product";
import type { Doc, Id } from "@/convex/_generated/dataModel";

type BranchProductWithProduct = Doc<"branchProducts"> & {
  product: Doc<"products"> | null;
};

interface BranchProductListProps {
  branchId: Id<"branches">;
}

export function BranchProductList({ branchId }: BranchProductListProps) {
  const branchProducts = useQuery(
    api.queries.listBranchProducts.listBranchProducts,
    { branchId }
  );
  const allProducts = useQuery(api.queries.listProducts.listProducts);
  const assignBranchProduct = useMutation(
    api.mutations.assignBranchProduct.assignBranchProduct
  );
  const updateBranchProduct = useMutation(
    api.mutations.updateBranchProduct.updateBranchProduct
  );

  const [search, setSearch] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"branchProducts"> | null>(null);

  // Products not yet assigned to this branch
  const availableProducts = useMemo(() => {
    if (!allProducts || !branchProducts) return [];
    const typed = branchProducts as BranchProductWithProduct[];
    const assignedIds = new Set(typed.map((bp) => bp.productId));
    return (allProducts as Doc<"products">[]).filter(
      (p) => p.isActive && !assignedIds.has(p._id)
    );
  }, [allProducts, branchProducts]);

  async function handleAssign(values: AssignBranchProductFormValues) {
    try {
      await assignBranchProduct({
        branchId,
        productId: values.productId as Id<"products">,
        beginningStock: values.beginningStock,
        deliveryInStoreDate: values.deliveryInStoreDate || undefined,
      });
      toast.success("Product assigned");
      setAssignOpen(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to assign product.";
      toast.error(message);
    }
  }

  async function handleUpdate(
    branchProductId: Id<"branchProducts">,
    values: UpdateBranchProductFormValues
  ) {
    try {
      await updateBranchProduct({
        branchProductId,
        beginningStock: values.beginningStock,
        deliveryInStoreDate: values.deliveryInStoreDate, // "" to clear
      });
      toast.success("Stock updated");
      setEditingId(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update stock.";
      toast.error(message);
    }
  }

  // Loading state
  if (branchProducts === undefined) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Assigned Products</h2>
        <Sheet open={assignOpen} onOpenChange={setAssignOpen}>
          <SheetTrigger render={<Button size="sm" />}>
            Assign Products
          </SheetTrigger>
          <SheetContent className="overflow-y-auto sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>Assign Product</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <AssignBranchProductForm
                availableProducts={availableProducts}
                onSubmit={handleAssign}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {branchProducts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No products assigned yet. Use &quot;Assign Products&quot; to add
          inventory.
        </p>
      ) : (
        <>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by style code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Style Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">BEG</TableHead>
              <TableHead className="text-right">SOH</TableHead>
              <TableHead>Delivery Date</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(branchProducts as BranchProductWithProduct[]).filter((bp) => {
              if (!search) return true;
              const q = search.toLowerCase();
              return (
                bp.product?.styleCode?.toLowerCase().includes(q) ||
                bp.product?.name?.toLowerCase().includes(q)
              );
            }).map((bp) => (
              <TableRow key={bp._id}>
                <TableCell className="font-mono text-sm font-medium">
                  <div className="flex items-center gap-2">
                    {bp.product?.imageUrl ? (
                      <img src={bp.product.imageUrl} alt="" className="h-8 w-8 rounded object-cover" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-[10px] font-medium text-muted-foreground">
                        {(bp.product?.styleCode ?? "").slice(-3)}
                      </div>
                    )}
                    {bp.product?.styleCode ?? "—"}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {bp.product?.name ?? "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {bp.beginningStock}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {bp.currentSOH}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {bp.deliveryInStoreDate
                    ? new Intl.DateTimeFormat("en-PH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }).format(new Date(bp.deliveryInStoreDate))
                    : "—"}
                </TableCell>
                <TableCell>
                  <Sheet
                    open={editingId === bp._id}
                    onOpenChange={(open) =>
                      setEditingId(open ? bp._id : null)
                    }
                  >
                    <SheetTrigger render={<Button variant="ghost" size="sm" />}>
                      Edit
                    </SheetTrigger>
                    <SheetContent className="overflow-y-auto sm:max-w-lg">
                      <SheetHeader>
                        <SheetTitle>
                          Edit Stock — {bp.product?.styleCode ?? ""}
                        </SheetTitle>
                      </SheetHeader>
                      <div className="mt-6">
                        <UpdateBranchProductForm
                          defaultValues={{
                            beginningStock: bp.beginningStock,
                            deliveryInStoreDate: bp.deliveryInStoreDate ?? "",
                          }}
                          onSubmit={(values) => handleUpdate(bp._id, values)}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </>
      )}
    </div>
  );
}
