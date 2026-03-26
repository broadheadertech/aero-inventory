"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { BranchForm } from "./branch-form";
import type { BranchFormValues } from "@/lib/validations/branch";
import type { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { BranchProductList } from "./branch-product-list";

interface BranchDetailClientProps {
  branchId: Id<"branches">;
}

export function BranchDetailClient({ branchId }: BranchDetailClientProps) {
  const branch = useQuery(api.queries.getBranch.getBranch, { branchId });
  const updateBranch = useMutation(api.mutations.updateBranch.updateBranch);

  async function handleUpdate(values: BranchFormValues) {
    try {
      await updateBranch({
        branchId,
        name: values.name,
        code: values.code,
        address: values.address,
        phone: values.phone,  // empty string → mutation normalizes to undefined (clears field)
        isActive: values.isActive,
      });
      toast.success("Branch updated");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update branch.";
      toast.error(message);
    }
  }

  if (branch === undefined) {
    return (
      <div className="space-y-4 max-w-lg">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (branch === null) {
    return (
      <p className="text-sm text-muted-foreground">Branch not found.</p>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Link
        href="/branches"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Back to Branches
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{branch.name}</h1>
        <p className="text-sm text-muted-foreground">Edit branch details</p>
      </div>
      <div className="max-w-lg">
        <BranchForm
          defaultValues={{
            name: branch.name,
            code: branch.code,
            address: branch.address,
            phone: branch.phone ?? "",
            isActive: branch.isActive,
          }}
          onSubmit={handleUpdate}
          submitLabel="Save Changes"
        />
      </div>
      <Separator />
      <BranchProductList branchId={branchId} />
    </div>
  );
}
