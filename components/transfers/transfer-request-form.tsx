"use client";

import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import {
  transferRequestSchema,
  type TransferRequestFormValues,
} from "@/lib/validations/transfer-request";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { Id, Doc } from "@/convex/_generated/dataModel";

// Local types for query results (anyApi returns `any`; cast for type safety)
type BranchItem = Doc<"branches">;
type BranchProductItem = Doc<"branchProducts"> & {
  product: Doc<"products"> | null;
};

interface TransferRequestFormProps {
  onSuccess: () => void;
}

export function TransferRequestForm({ onSuccess }: TransferRequestFormProps) {
  const createTransferRequest = useMutation(
    api.mutations.createTransferRequest.createTransferRequest
  );
  const branches = useQuery(
    api.queries.listActiveBranches.listActiveBranches
  ) as BranchItem[] | undefined;
  const branchProducts = useQuery(
    api.queries.listMyBranchProducts.listMyBranchProducts
  ) as BranchProductItem[] | undefined;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TransferRequestFormValues>({
    resolver: zodResolver(transferRequestSchema),
    defaultValues: {
      destinationBranchId: "",
      items: [{ branchProductId: "", quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  // Watch all items to enable dynamic SOH feedback and deduplication
  const watchedItems = useWatch({ control, name: "items" });

  // Derive user's branch ID from their assigned products
  const userBranchId = branchProducts?.[0]?.branchId;

  // Filter destination branches: exclude user's own branch
  const destinationBranches = (branches ?? []).filter(
    (b) => b._id !== userBranchId
  );

  // Get a branch product record by its ID (for SOH lookup)
  function getBranchProduct(branchProductId: string) {
    return branchProducts?.find((bp) => bp._id === branchProductId) ?? null;
  }

  // All currently-selected branchProductIds (for deduplication in dropdowns)
  const selectedIds = new Set(
    (watchedItems ?? []).map((item) => item.branchProductId).filter(Boolean)
  );

  // H2 fix: block submit if any row's quantity exceeds available SOH
  const hasAnyExceeded = (watchedItems ?? []).some((item) => {
    const bp = getBranchProduct(item.branchProductId ?? "");
    return bp !== null && (item.quantity ?? 0) > bp.currentSOH;
  });

  async function onSubmit(values: TransferRequestFormValues) {
    try {
      await createTransferRequest({
        destinationBranchId: values.destinationBranchId as Id<"branches">,
        items: values.items.map((item) => ({
          branchProductId: item.branchProductId as Id<"branchProducts">,
          quantity: item.quantity,
        })),
      });
      toast.success("Transfer request submitted for approval");
      onSuccess();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to submit transfer request.";
      toast.error(message);
    }
  }

  // Loading state
  if (!branchProducts || !branches) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  // No products assigned — can't create transfer
  if (branchProducts.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No products are assigned to your branch. Contact your administrator.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-4">
      {/* Destination Branch */}
      <div className="space-y-1.5">
        <Label htmlFor="destinationBranchId">
          Destination Branch <span aria-hidden="true">*</span>
        </Label>
        <select
          id="destinationBranchId"
          {...register("destinationBranchId")}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Select destination branch...</option>
          {destinationBranches.map((b) => (
            <option key={b._id} value={b._id}>
              {b.name}
            </option>
          ))}
        </select>
        {errors.destinationBranchId && (
          <p role="alert" className="text-sm text-destructive">
            {errors.destinationBranchId.message}
          </p>
        )}
      </div>

      {/* Product Items */}
      <div className="space-y-3">
        <Label>
          Products <span aria-hidden="true">*</span>
        </Label>

        {fields.map((field, index) => {
          const currentBpId = watchedItems?.[index]?.branchProductId ?? "";
          const selectedBp = getBranchProduct(currentBpId);
          const currentQty = watchedItems?.[index]?.quantity ?? 0;
          const sohExceeded =
            selectedBp !== null && currentQty > selectedBp.currentSOH;

          return (
            <div
              key={field.id}
              className="rounded-md border bg-card p-3 space-y-2.5"
            >
              {/* Product dropdown */}
              <div className="space-y-1">
                <Label
                  htmlFor={`items.${index}.branchProductId`}
                  className="text-xs text-muted-foreground"
                >
                  Product
                </Label>
                <select
                  id={`items.${index}.branchProductId`}
                  {...register(`items.${index}.branchProductId`)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select product...</option>
                  {branchProducts
                    .filter(
                      (bp) =>
                        bp.product?.isActive &&
                        bp.currentSOH > 0 &&
                        // Show this option if it's the currently-selected one for this row,
                        // or if it hasn't been selected in any other row
                        (bp._id === currentBpId || !selectedIds.has(bp._id))
                    )
                    .map((bp) => (
                      <option key={bp._id} value={bp._id}>
                        {bp.product?.styleCode} — {bp.product?.name} (SOH:{" "}
                        {bp.currentSOH})
                      </option>
                    ))}
                </select>
                {errors.items?.[index]?.branchProductId && (
                  <p role="alert" className="text-sm text-destructive">
                    {errors.items[index]?.branchProductId?.message}
                  </p>
                )}
              </div>

              {/* Quantity + Remove row */}
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <Label
                    htmlFor={`items.${index}.quantity`}
                    className="text-xs text-muted-foreground"
                  >
                    Quantity
                    {selectedBp ? ` (max: ${selectedBp.currentSOH})` : ""}
                  </Label>
                  <Input
                    id={`items.${index}.quantity`}
                    type="number"
                    min="1"
                    max={selectedBp?.currentSOH ?? undefined}
                    step="1"
                    {...register(`items.${index}.quantity`, {
                      valueAsNumber: true,
                    })}
                    aria-invalid={
                      !!errors.items?.[index]?.quantity || sohExceeded
                    }
                  />
                  {errors.items?.[index]?.quantity && (
                    <p role="alert" className="text-sm text-destructive">
                      {errors.items[index]?.quantity?.message}
                    </p>
                  )}
                  {/* Dynamic SOH exceeded warning (server also validates) */}
                  {sohExceeded && (
                    <p role="alert" className="text-sm text-destructive">
                      Quantity exceeds available stock (
                      {selectedBp!.currentSOH} available)
                    </p>
                  )}
                </div>

                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => remove(index)}
                    className="shrink-0"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {/* Array-level error (e.g. min(1) not met) */}
        {errors.items?.root?.message && (
          <p role="alert" className="text-sm text-destructive">
            {errors.items.root.message}
          </p>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ branchProductId: "", quantity: 1 })}
        >
          + Add Product
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        <span aria-hidden="true">*</span> Required
      </p>

      <Button
        type="submit"
        disabled={isSubmitting || hasAnyExceeded}
        className="h-11 w-full text-base"
      >
        {isSubmitting ? "Submitting..." : "Submit Transfer Request"}
      </Button>
    </form>
  );
}
