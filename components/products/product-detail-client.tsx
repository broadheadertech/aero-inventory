"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductForm } from "./product-form";
import type { ProductFormValues } from "@/lib/validations/product";
import type { Id } from "@/convex/_generated/dataModel";

interface ProductDetailClientProps {
  productId: Id<"products">;
}

export function ProductDetailClient({ productId }: ProductDetailClientProps) {
  const product = useQuery(api.queries.getProduct.getProduct, { productId });
  const updateProduct = useMutation(api.mutations.updateProduct.updateProduct);

  async function handleUpdate(values: ProductFormValues) {
    try {
      await updateProduct({
        productId,
        styleCode: values.styleCode,
        name: values.name,
        department: values.department,
        class: values.class,           // "" clears the field (mutation converts "" → undefined)
        category: values.category,
        subcategory: values.subcategory, // "" clears the field
        collection: values.collection,
        fabric: values.fabric,           // "" clears the field
        color: values.color,
        printApplication: values.printApplication, // "" clears the field
        unitCost: Math.round(values.unitCost * 100),       // pesos → centavos
        retailPrice: Math.round(values.retailPrice * 100), // pesos → centavos
        isActive: values.isActive,
      });
      toast.success("Product updated");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update product.";
      toast.error(message);
    }
  }

  if (product === undefined) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-5 w-48" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (product === null) {
    return (
      <div className="space-y-4">
        <Link
          href="/products"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Back to Products
        </Link>
        <p className="text-sm text-muted-foreground">Product not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Link
        href="/products"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Back to Products
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight font-mono">
          {product.styleCode}
        </h1>
        <p className="text-sm text-muted-foreground">{product.name}</p>
      </div>
      <ProductForm
        defaultValues={{
          styleCode: product.styleCode,
          name: product.name,
          department: product.department,
          class: product.class ?? "",
          category: product.category,
          subcategory: product.subcategory ?? "",
          collection: product.collection,
          fabric: product.fabric ?? "",
          color: product.color,
          printApplication: product.printApplication ?? "",
          unitCost: product.unitCost / 100,       // centavos → pesos for display
          retailPrice: product.retailPrice / 100, // centavos → pesos for display
          isActive: product.isActive,
        }}
        onSubmit={handleUpdate}
        submitLabel="Save Changes"
      />
    </div>
  );
}
