"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
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
import { BranchTable } from "./branch-table";
import { BranchForm } from "./branch-form";
import type { BranchFormValues } from "@/lib/validations/branch";
import type { Doc } from "@/convex/_generated/dataModel";

export function BranchListClient() {
  const branches = useQuery(api.queries.listBranches.listBranches) as Doc<"branches">[] | undefined;
  const createBranch = useMutation(api.mutations.createBranch.createBranch);
  const [open, setOpen] = useState(false);

  const warehouseExists = (branches ?? []).some((b) => b.type === "warehouse");

  async function handleCreate(values: BranchFormValues) {
    try {
      await createBranch({
        name: values.name,
        code: values.code,
        address: values.address,
        phone: values.phone || undefined,
        isActive: values.isActive,
        type: values.type,
      });
      toast.success("Branch created");
      setOpen(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create branch.";
      toast.error(message);
    }
  }

  if (branches === undefined) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Branches</h1>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button />}>
            Create Branch
          </SheetTrigger>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Create Branch</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <BranchForm
                onSubmit={handleCreate}
                submitLabel="Create Branch"
                warehouseExists={warehouseExists}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {branches.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No branches yet. Create your first branch to get started.
        </p>
      ) : (
        <BranchTable branches={branches} />
      )}
    </div>
  );
}
