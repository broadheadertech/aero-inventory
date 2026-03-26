"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { branchSchema, type BranchFormValues } from "@/lib/validations/branch";
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

interface BranchFormProps {
  defaultValues?: Partial<BranchFormValues>;
  onSubmit: (values: BranchFormValues) => Promise<void>;
  submitLabel?: string;
  warehouseExists?: boolean;
}

export function BranchForm({
  defaultValues,
  onSubmit,
  submitLabel = "Save",
  warehouseExists = false,
}: BranchFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: "",
      code: "",
      address: "",
      phone: "",
      isActive: true,
      type: "branch",
      ...defaultValues,
    },
  });

  const isActive = watch("isActive");
  const type = watch("type");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <fieldset disabled={isSubmitting} className="space-y-4">
        {/* Name */}
        <div className="space-y-1">
          <Label htmlFor="name">
            Branch Name <span aria-hidden="true">*</span>
          </Label>
          <Input
            id="name"
            placeholder="e.g. BGC Main"
            {...register("name")}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {errors.name && (
            <p id="name-error" className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        {/* Code */}
        <div className="space-y-1">
          <Label htmlFor="code">
            Branch Code <span aria-hidden="true">*</span>
          </Label>
          <Input
            id="code"
            placeholder="e.g. BGC-01"
            {...register("code")}
            aria-invalid={!!errors.code}
            aria-describedby={errors.code ? "code-error" : undefined}
          />
          {errors.code && (
            <p id="code-error" className="text-sm text-destructive">{errors.code.message}</p>
          )}
        </div>

        {/* Address */}
        <div className="space-y-1">
          <Label htmlFor="address">
            Address / Location <span aria-hidden="true">*</span>
          </Label>
          <Input
            id="address"
            placeholder="e.g. 3F Bonifacio High Street, BGC, Taguig"
            {...register("address")}
            aria-invalid={!!errors.address}
            aria-describedby={errors.address ? "address-error" : undefined}
          />
          {errors.address && (
            <p id="address-error" className="text-sm text-destructive">{errors.address.message}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-1">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            placeholder="e.g. +63 2 8123 4567"
            {...register("phone")}
          />
        </div>

        {/* Type */}
        <div className="space-y-1">
          <Label htmlFor="type">
            Location Type <span aria-hidden="true">*</span>
          </Label>
          <Select
            value={type}
            onValueChange={(val) =>
              setValue("type", val as "branch" | "warehouse", { shouldValidate: true })
            }
          >
            <SelectTrigger id="type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="branch">Branch</SelectItem>
              <SelectItem value="warehouse" disabled={warehouseExists}>
                Warehouse{warehouseExists ? " (already exists)" : ""}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="space-y-1">
          <Label htmlFor="isActive">
            Status <span aria-hidden="true">*</span>
          </Label>
          <Select
            value={isActive ? "active" : "inactive"}
            onValueChange={(val) =>
              setValue("isActive", val === "active", { shouldValidate: true })
            }
          >
            <SelectTrigger id="isActive">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-xs text-muted-foreground">
          <span aria-hidden="true">*</span> Required
        </p>
      </fieldset>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
