"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateSalesEntrySchema,
  type UpdateSalesEntryFormValues,
} from "@/lib/validations/sales-entry-edit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EditSalesEntryFormProps {
  defaultValues: UpdateSalesEntryFormValues;
  salePrice: number; // centavos — displayed read-only, never editable
  productName: string; // for context display
  onSubmit: (values: UpdateSalesEntryFormValues) => Promise<void>;
}

export function EditSalesEntryForm({
  defaultValues,
  salePrice,
  productName,
  onSubmit,
}: EditSalesEntryFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateSalesEntryFormValues>({
    resolver: zodResolver(updateSalesEntrySchema),
    defaultValues,
  });

  const formattedPrice = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(salePrice / 100);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Context: show product name */}
      {productName && (
        <p className="text-sm text-muted-foreground">{productName}</p>
      )}

      <fieldset disabled={isSubmitting} className="space-y-4">
        {/* Sale Price — read-only, financial integrity: never editable after logging */}
        <div className="space-y-1">
          <Label>Sale Price</Label>
          <Input
            value={formattedPrice}
            readOnly
            disabled
            className="bg-muted cursor-not-allowed"
            aria-label="Sale price (read-only)"
          />
          <p className="text-xs text-muted-foreground">
            Sale price cannot be changed after logging.
          </p>
        </div>

        {/* Quantity Sold — editable */}
        <div className="space-y-1">
          <Label htmlFor="quantitySold">
            Quantity Sold <span aria-hidden="true">*</span>
          </Label>
          <Input
            id="quantitySold"
            type="number"
            min="1"
            step="1"
            {...register("quantitySold", { valueAsNumber: true })}
            aria-invalid={!!errors.quantitySold}
            aria-describedby={
              errors.quantitySold ? "quantitySold-error" : undefined
            }
          />
          {errors.quantitySold && (
            <p id="quantitySold-error" className="text-sm text-destructive">
              {errors.quantitySold.message}
            </p>
          )}
        </div>

        {/* Notes — optional, can be cleared */}
        <div className="space-y-1">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Optional note about this sale..."
            rows={3}
            {...register("notes")}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          <span aria-hidden="true">*</span> Required
        </p>
      </fieldset>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
