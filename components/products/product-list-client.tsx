"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ProductTable } from "./product-table";
import { ProductForm } from "./product-form";
import { ProductFilterBar, type ProductFilters } from "./product-filter-bar";
import type { ProductFormValues } from "@/lib/validations/product";

const EMPTY_FILTERS: ProductFilters = {
  search: "",
  department: "",
  category: "",
  collection: "",
  color: "",
  class: "",
};

export function ProductListClient() {
  const products = useQuery(api.queries.listProducts.listProducts);
  const createProduct = useMutation(api.mutations.createProduct.createProduct);
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>(EMPTY_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Debounce search to avoid filtering on every keystroke
  useEffect(() => {
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(
      () => setDebouncedSearch(filters.search),
      300
    );
    return () => clearTimeout(searchTimerRef.current);
  }, [filters.search]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p: Doc<"products">) => {
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        if (
          !p.styleCode.toLowerCase().includes(q) &&
          !p.name.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (filters.department && p.department !== filters.department) return false;
      if (filters.category && p.category !== filters.category) return false;
      if (filters.collection && p.collection !== filters.collection) return false;
      if (filters.color && p.color !== filters.color) return false;
      if (filters.class && p.class !== filters.class) return false;
      return true;
    });
  }, [products, debouncedSearch, filters]);

  async function handleCreate(values: ProductFormValues) {
    try {
      await createProduct({
        styleCode: values.styleCode,
        name: values.name,
        department: values.department,
        class: values.class || undefined,
        category: values.category,
        subcategory: values.subcategory || undefined,
        collection: values.collection,
        fabric: values.fabric || undefined,
        color: values.color,
        printApplication: values.printApplication || undefined,
        unitCost: Math.round(values.unitCost * 100),       // pesos → centavos
        retailPrice: Math.round(values.retailPrice * 100), // pesos → centavos
        isActive: values.isActive,
      });
      toast.success("Product added");
      setOpen(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to add product.";
      toast.error(message);
    }
  }

  if (products === undefined) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Skeleton className="h-10 w-72" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button />}>Add Product</SheetTrigger>
          <SheetContent className="overflow-y-auto sm:max-w-xl">
            <SheetHeader>
              <SheetTitle>Add Product</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <ProductForm onSubmit={handleCreate} submitLabel="Add Product" />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <ProductFilterBar
        filters={filters}
        onChange={setFilters}
        products={products}
      />

      {filteredProducts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {products.length === 0
            ? "No products yet. Add your first product to get started."
            : "No products match the current filters."}
        </p>
      ) : (
        <ProductTable products={filteredProducts} />
      )}
    </div>
  );
}
