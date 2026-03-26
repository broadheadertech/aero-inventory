"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserFormValues,
  type UpdateUserFormValues,
} from "@/lib/validations/user";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";

interface UserWithBranches {
  _id: string;
  name: string;
  email: string;
  role: "Admin" | "Branch Manager" | "Branch Staff";
  branchIds: string[];
  isActive: boolean;
}

interface UserFormSheetProps {
  mode: "create" | "edit";
  user?: UserWithBranches;
  open: boolean;
  onClose: () => void;
}

const ROLES = ["Admin", "Branch Manager", "Branch Staff"] as const;

function BranchCheckboxList({
  branches,
  selectedIds,
  onToggle,
  error,
}: {
  branches: { _id: string; name: string; code: string }[] | undefined;
  selectedIds: string[];
  onToggle: (id: string) => void;
  error?: string;
}) {
  if (branches === undefined) {
    return <p className="text-sm text-muted-foreground">Loading branches…</p>;
  }
  if (branches.length === 0) {
    return <p className="text-sm text-muted-foreground">No active branches available.</p>;
  }
  return (
    <div className="space-y-1">
      <div className="rounded-md border divide-y max-h-48 overflow-y-auto">
        {branches.map((branch) => (
          <label
            key={branch._id}
            className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-muted/50"
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(branch._id)}
              onChange={() => onToggle(branch._id)}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            <span className="flex-1">{branch.name}</span>
            <span className="text-muted-foreground text-xs">{branch.code}</span>
          </label>
        ))}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function CreateForm({
  branches,
  open,
  onClose,
  createUser,
}: {
  branches: { _id: string; name: string; code: string }[] | undefined;
  open: boolean;
  onClose: () => void;
  createUser: (args: {
    name: string;
    email: string;
    password: string;
    role: "Admin" | "Branch Manager" | "Branch Staff";
    branchIds: Id<"branches">[];
  }) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: "", email: "", password: "", role: "Branch Staff", branchIds: [] },
  });

  // Reset form each time the sheet opens (F3 fix: `open` in deps so it fires on reopen)
  useEffect(() => {
    if (open) {
      reset({ name: "", email: "", password: "", role: "Branch Staff", branchIds: [] });
    }
  }, [open, reset]);

  const role = watch("role");
  const branchIds = watch("branchIds");

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createUser({
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
        branchIds: values.branchIds as Id<"branches">[],
      });
      toast.success("User created");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create user");
    }
  });

  const toggleBranch = (id: string) => {
    const next = branchIds.includes(id)
      ? branchIds.filter((b) => b !== id)
      : [...branchIds, id];
    setValue("branchIds", next, { shouldValidate: true });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 px-4 py-2">
      <fieldset disabled={isSubmitting} className="flex flex-col gap-4">
        <div className="space-y-1">
          <Label htmlFor="c-name">Name <span aria-hidden="true">*</span></Label>
          <Input
            id="c-name"
            placeholder="Full name"
            {...register("name")}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "c-name-error" : undefined}
          />
          {errors.name && <p id="c-name-error" className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="c-email">Email <span aria-hidden="true">*</span></Label>
          <Input
            id="c-email"
            type="email"
            placeholder="user@example.com"
            {...register("email")}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "c-email-error" : undefined}
          />
          {errors.email && <p id="c-email-error" className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="c-password">Password <span aria-hidden="true">*</span></Label>
          <Input
            id="c-password"
            type="password"
            placeholder="Min. 8 characters"
            {...register("password")}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "c-password-error" : undefined}
          />
          {errors.password && <p id="c-password-error" className="text-sm text-destructive">{errors.password.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="c-role">Role <span aria-hidden="true">*</span></Label>
          <Select
            value={role}
            onValueChange={(val) =>
              setValue("role", val as typeof ROLES[number], { shouldValidate: true })
            }
          >
            <SelectTrigger id="c-role" className="w-full">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {role !== "Admin" && (
          <div className="space-y-2">
            <Label>Branch(es) <span aria-hidden="true">*</span></Label>
            <BranchCheckboxList
              branches={branches}
              selectedIds={branchIds}
              onToggle={toggleBranch}
              error={(errors.branchIds as { message?: string } | undefined)?.message}
            />
          </div>
        )}

        <p className="text-xs text-muted-foreground"><span aria-hidden="true">*</span> Required</p>
      </fieldset>

      <SheetFooter className="px-0">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Create User"}
        </Button>
      </SheetFooter>
    </form>
  );
}

function EditForm({
  user,
  branches,
  onClose,
  updateUser,
}: {
  user: UserWithBranches;
  branches: { _id: string; name: string; code: string }[] | undefined;
  onClose: () => void;
  updateUser: (args: {
    userId: Id<"users">;
    name: string;
    role: "Admin" | "Branch Manager" | "Branch Staff";
    branchIds: Id<"branches">[];
  }) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: { name: user.name, role: user.role, branchIds: user.branchIds },
  });

  useEffect(() => {
    reset({ name: user.name, role: user.role, branchIds: user.branchIds });
  }, [user._id, reset, user.name, user.role, user.branchIds]);

  const role = watch("role");
  const branchIds = watch("branchIds");

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateUser({
        userId: user._id as Id<"users">,
        name: values.name,
        role: values.role,
        branchIds: values.branchIds as Id<"branches">[],
      });
      toast.success("User updated");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update user");
    }
  });

  const toggleBranch = (id: string) => {
    const next = branchIds.includes(id)
      ? branchIds.filter((b) => b !== id)
      : [...branchIds, id];
    setValue("branchIds", next, { shouldValidate: true });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 px-4 py-2">
      <fieldset disabled={isSubmitting} className="flex flex-col gap-4">
        <div className="space-y-1">
          <Label htmlFor="e-name">Name <span aria-hidden="true">*</span></Label>
          <Input
            id="e-name"
            placeholder="Full name"
            {...register("name")}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "e-name-error" : undefined}
          />
          {errors.name && <p id="e-name-error" className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1">
          <Label>Email</Label>
          <Input value={user.email} disabled className="bg-muted/50 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
        </div>

        <div className="space-y-1">
          <Label htmlFor="e-role">Role <span aria-hidden="true">*</span></Label>
          <Select
            value={role}
            onValueChange={(val) =>
              setValue("role", val as typeof ROLES[number], { shouldValidate: true })
            }
          >
            <SelectTrigger id="e-role" className="w-full">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {role !== "Admin" && (
          <div className="space-y-2">
            <Label>Branch(es) <span aria-hidden="true">*</span></Label>
            <BranchCheckboxList
              branches={branches}
              selectedIds={branchIds}
              onToggle={toggleBranch}
              error={(errors.branchIds as { message?: string } | undefined)?.message}
            />
          </div>
        )}

        <p className="text-xs text-muted-foreground"><span aria-hidden="true">*</span> Required</p>
      </fieldset>

      <SheetFooter className="px-0">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save Changes"}
        </Button>
      </SheetFooter>
    </form>
  );
}

export function UserFormSheet({ mode, user, open, onClose }: UserFormSheetProps) {
  // Skip query when sheet is closed to avoid unnecessary network traffic (F7)
  const allBranches = useQuery(
    api.queries.listBranches.listBranches,
    open ? {} : "skip"
  ) as { _id: string; name: string; code: string; isActive: boolean }[] | undefined;

  // Filter to active branches only — inactive branches must not be assignable (F2)
  const branches = allBranches?.filter((b) => b.isActive);

  const createUserAction = useAction(api.actions.createUser.createUser);
  const updateUserMutation = useMutation(api.mutations.updateUser.updateUser);

  const isCreate = mode === "create";

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isCreate ? "Add User" : "Edit User"}</SheetTitle>
          <SheetDescription>
            {isCreate
              ? "Create a new user account with a role and branch assignment."
              : "Update the user's name, role, and branch assignment."}
          </SheetDescription>
        </SheetHeader>

        {isCreate ? (
          <CreateForm
            branches={branches}
            open={open}
            onClose={onClose}
            createUser={createUserAction}
          />
        ) : user ? (
          <EditForm
            user={user}
            branches={branches}
            onClose={onClose}
            updateUser={updateUserMutation}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
