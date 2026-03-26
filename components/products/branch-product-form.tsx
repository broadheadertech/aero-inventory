"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  assignBranchProductSchema,
  type AssignBranchProductFormValues,
  updateBranchProductSchema,
  type UpdateBranchProductFormValues,
} from "@/lib/validations/branch-product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Doc } from "@/convex/_generated/dataModel";

// ─── Assign Form ───────────────────────────────────────────────────────────

interface AssignBranchProductFormProps {
  /** Products NOT yet assigned to this branch */
  availableProducts: Doc<"products">[];
  onSubmit: (values: AssignBranchProductFormValues) => Promise<void>;
}

export function AssignBranchProductForm({
  availableProducts,
  onSubmit,
}: AssignBranchProductFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AssignBranchProductFormValues>({
    resolver: zodResolver(assignBranchProductSchema),
    defaultValues: {
      productId: "",
      beginningStock: 0,
      deliveryInStoreDate: "",
    },
  });

  const selectedProductId = watch("productId");

  async function handleFormSubmit(values: AssignBranchProductFormValues) {
    await onSubmit(values);
    reset(); // clear form after successful assignment
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <fieldset disabled={isSubmitting} className="space-y-4">
        {/* Product selector */}
        <div className="space-y-1">
          <Label htmlFor="productId">
            Product <span aria-hidden="true">*</span>
          </Label>
          <Select
            value={selectedProductId || ""}
            onValueChange={(v) =>
              setValue("productId", v ?? "", { shouldValidate: true })
            }
          >
            <SelectTrigger
              id="productId"
              aria-invalid={!!errors.productId}
              aria-describedby={
                errors.productId ? "productId-error" : undefined
              }
            >
              <SelectValue placeholder="Select a product..." />
            </SelectTrigger>
            <SelectContent>
              {availableProducts.map((p) => (
                <SelectItem key={p._id} value={p._id}>
                  <span className="font-mono">{p.styleCode}</span>
                  {" — "}
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.productId && (
            <p id="productId-error" className="text-sm text-destructive">
              {errors.productId.message}
            </p>
          )}
          {availableProducts.length === 0 && (
            <p className="text-sm text-muted-foreground">
              All products are already assigned to this branch.
            </p>
          )}
        </div>

        {/* BEG quantity */}
        <div className="space-y-1">
          <Label htmlFor="beginningStock">
            Beginning Stock (BEG) <span aria-hidden="true">*</span>
          </Label>
          <Input
            id="beginningStock"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            {...register("beginningStock", { valueAsNumber: true })}
            aria-invalid={!!errors.beginningStock}
            aria-describedby={
              errors.beginningStock ? "beginningStock-error" : undefined
            }
          />
          {errors.beginningStock && (
            <p id="beginningStock-error" className="text-sm text-destructive">
              {errors.beginningStock.message}
            </p>
          )}
        </div>

        {/* Delivery In Store Date (optional — used for aging in Epic 4) */}
        <div className="space-y-1">
          <Label htmlFor="deliveryInStoreDate">Delivery in Store Date</Label>
          <Input
            id="deliveryInStoreDate"
            type="date"
            {...register("deliveryInStoreDate")}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          <span aria-hidden="true">*</span> Required
        </p>
      </fieldset>

      <Button
        type="submit"
        disabled={isSubmitting || availableProducts.length === 0}
        className="w-full"
      >
        {isSubmitting ? "Assigning..." : "Assign Product"}
      </Button>
    </form>
  );
}

// ─── Update Form ────────────────────────────────────────────────────────────

interface UpdateBranchProductFormProps {
  defaultValues: UpdateBranchProductFormValues;
  onSubmit: (values: UpdateBranchProductFormValues) => Promise<void>;
}

export function UpdateBranchProductForm({
  defaultValues,
  onSubmit,
}: UpdateBranchProductFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateBranchProductFormValues>({
    resolver: zodResolver(updateBranchProductSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <fieldset disabled={isSubmitting} className="space-y-4">
        {/* BEG quantity */}
        <div className="space-y-1">
          <Label htmlFor="beginningStock">
            Beginning Stock (BEG) <span aria-hidden="true">*</span>
          </Label>
          <Input
            id="beginningStock"
            type="number"
            min="0"
            step="1"
            {...register("beginningStock", { valueAsNumber: true })}
            aria-invalid={!!errors.beginningStock}
            aria-describedby={
              errors.beginningStock ? "beginningStock-error" : undefined
            }
          />
          {errors.beginningStock && (
            <p id="beginningStock-error" className="text-sm text-destructive">
              {errors.beginningStock.message}
            </p>
          )}
        </div>

        {/* Delivery In Store Date */}
        <div className="space-y-1">
          <Label htmlFor="deliveryInStoreDate">Delivery in Store Date</Label>
          <Input
            id="deliveryInStoreDate"
            type="date"
            {...register("deliveryInStoreDate")}
          />
        </div>
      </fieldset>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
