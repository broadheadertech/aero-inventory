"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { productSchema, type ProductFormValues } from "@/lib/validations/product";
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
import { ImagePlus, Loader2 } from "lucide-react";

interface ProductFormProps {
  defaultValues?: Partial<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  submitLabel?: string;
  existingImageUrl?: string;
}

export function ProductForm({
  defaultValues,
  onSubmit,
  submitLabel = "Save",
  existingImageUrl,
}: ProductFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      styleCode: "",
      name: "",
      department: "",
      class: "",
      category: "",
      subcategory: "",
      collection: "",
      fabric: "",
      color: "",
      printApplication: "",
      unitCost: 0,
      retailPrice: 0,
      isActive: true,
      ...defaultValues,
    },
  });

  const isActive = watch("isActive");
  const generateUploadUrl = useMutation(api.mutations.generateUploadUrl.generateUploadUrl);
  const [imageUrl, setImageUrl] = useState(existingImageUrl ?? "");
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      const { storageId } = await result.json();
      const url = `${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/${storageId}`;
      setImageUrl(url);
      setValue("imageUrl" as keyof ProductFormValues, url as never);
    } catch {
      // Silent fail for demo
    } finally {
      setUploading(false);
    }
  };

  const wrappedSubmit = async (values: ProductFormValues) => {
    await onSubmit({ ...values, imageUrl: imageUrl || undefined } as ProductFormValues);
  };

  return (
    <form onSubmit={handleSubmit(wrappedSubmit)} className="space-y-6">
      <fieldset disabled={isSubmitting} className="space-y-6">
        {/* Image Upload */}
        <div className="flex items-start gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted">
            {imageUrl ? (
              <img src={imageUrl} alt="Product" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            )}
          </div>
          <div className="flex-1 space-y-1">
            <Label htmlFor="styleCode">Style Code <span className="text-destructive">*</span></Label>
            <Input id="styleCode" placeholder="e.g. AB-1234" {...register("styleCode")} className="font-mono" />
            {errors.styleCode && <p className="text-xs text-destructive">{errors.styleCode.message}</p>}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="name">Description <span className="text-destructive">*</span></Label>
          <Input id="name" placeholder="e.g. Basic Crew-Neck Tee" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        {/* Pricing */}
        <div className="rounded-lg border p-4 space-y-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pricing</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="retailPrice">SRP (₱) <span className="text-destructive">*</span></Label>
              <Input id="retailPrice" type="number" step="0.01" min="0" placeholder="0.00" {...register("retailPrice", { valueAsNumber: true })} />
              {errors.retailPrice && <p className="text-xs text-destructive">{errors.retailPrice.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unitCost">Cost (₱) <span className="text-destructive">*</span></Label>
              <Input id="unitCost" type="number" step="0.01" min="0" placeholder="0.00" {...register("unitCost", { valueAsNumber: true })} />
              {errors.unitCost && <p className="text-xs text-destructive">{errors.unitCost.message}</p>}
            </div>
          </div>
        </div>

        {/* Classification */}
        <div className="rounded-lg border p-4 space-y-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Classification</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="department">Department <span className="text-destructive">*</span></Label>
              <Input id="department" placeholder="e.g. Mens" {...register("department")} />
              {errors.department && <p className="text-xs text-destructive">{errors.department.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">Category <span className="text-destructive">*</span></Label>
              <Input id="category" placeholder="e.g. T-Shirts" {...register("category")} />
              {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="class">Class</Label>
              <Input id="class" placeholder="e.g. Tops" {...register("class")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subcategory">Subcategory</Label>
              <Input id="subcategory" placeholder="e.g. Graphic Tees" {...register("subcategory")} />
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="rounded-lg border p-4 space-y-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Details</p>
          <div className="space-y-1.5">
            <Label htmlFor="collection">Collection <span className="text-destructive">*</span></Label>
            <Input id="collection" placeholder="e.g. Spring 2026" {...register("collection")} />
            {errors.collection && <p className="text-xs text-destructive">{errors.collection.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="color">Color <span className="text-destructive">*</span></Label>
              <Input id="color" placeholder="e.g. Navy Blue" {...register("color")} />
              {errors.color && <p className="text-xs text-destructive">{errors.color.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fabric">Fabric</Label>
              <Input id="fabric" placeholder="e.g. 100% Cotton" {...register("fabric")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="printApplication">Print Application</Label>
            <Input id="printApplication" placeholder="e.g. Screen Print" {...register("printApplication")} />
          </div>
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select
            value={isActive ? "active" : "inactive"}
            onValueChange={(val) => setValue("isActive", val === "active", { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </fieldset>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : submitLabel}
      </Button>
    </form>
  );
}
