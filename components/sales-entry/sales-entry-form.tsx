"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import {
  salesEntrySchema,
  type SalesEntryFormValues,
} from "@/lib/validations/sales-entry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BranchProductSearchResult } from "./product-search";
import type { Id } from "@/convex/_generated/dataModel";

interface SalesEntryFormProps {
  product: BranchProductSearchResult;
  onSuccess: () => void;
}

export function SalesEntryForm({ product, onSuccess }: SalesEntryFormProps) {
  const createSalesEntry = useMutation(
    api.mutations.createSalesEntry.createSalesEntry
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SalesEntryFormValues>({
    resolver: zodResolver(salesEntrySchema),
    defaultValues: {
      branchProductId: product.branchProductId,
      quantitySold: 1,
      salePrice: undefined,
      notes: "",
    },
  });

  async function onSubmit(values: SalesEntryFormValues) {
    try {
      await createSalesEntry({
        branchProductId: values.branchProductId as Id<"branchProducts">,
        quantitySold: values.quantitySold,
        salePrice: values.salePrice,
        notes: values.notes || undefined,
      });
      toast.success(`Logged: ${product.styleCode} × ${values.quantitySold}`, {
        duration: 3000,
      });
      reset();
      onSuccess();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to log sale.";
      toast.error(message);
    }
  }

  // Format retailPrice from centavos to display string (e.g., ₱1,299.00)
  const srpDisplay = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(product.retailPrice / 100);

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      {/* Product info panel (read-only) */}
      <div className="space-y-1">
        <p className="font-mono text-lg font-semibold tracking-wider">
          {product.styleCode}
        </p>
        <p className="text-sm text-muted-foreground">{product.name}</p>
        <div className="flex items-center gap-4 text-sm">
          <span>
            <span className="text-muted-foreground">SRP: </span>
            <span className="font-medium tabular-nums">{srpDisplay}</span>
          </span>
          <span>
            <span className="text-muted-foreground">SOH: </span>
            <span className="font-medium tabular-nums">
              {product.currentSOH}
            </span>
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <fieldset disabled={isSubmitting} className="space-y-4">
          {/* Hidden branchProductId */}
          <input type="hidden" {...register("branchProductId")} />

          {/* Quantity */}
          <div className="space-y-1">
            <Label htmlFor="quantitySold">
              Quantity Sold <span aria-hidden="true">*</span>
            </Label>
            <Input
              id="quantitySold"
              type="number"
              min="1"
              max={product.currentSOH}
              step="1"
              {...register("quantitySold", { valueAsNumber: true })}
              aria-invalid={!!errors.quantitySold}
              aria-describedby={
                errors.quantitySold ? "quantitySold-error" : undefined
              }
              className="h-12 text-base tabular-nums" // 48px touch target
            />
            {errors.quantitySold && (
              <p
                id="quantitySold-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {errors.quantitySold.message}
              </p>
            )}
          </div>

          {/* Notes (optional) */}
          <div className="space-y-1">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              type="text"
              placeholder="Any remarks..."
              {...register("notes")}
              className="h-12 text-base"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            <span aria-hidden="true">*</span> Required
          </p>
        </fieldset>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full text-base" // 48px touch target
        >
          {isSubmitting ? "Logging..." : "Log Sale"}
        </Button>
      </form>
    </div>
  );
}
