"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserFormSheet } from "./user-form-sheet";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

interface UserWithBranches {
  _id: string;
  clerkUserId: string;
  name: string;
  email: string;
  role: "Admin" | "Branch Manager" | "Branch Staff";
  branchIds: string[];
  branchNames: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  Admin: "Admin",
  "Branch Manager": "Branch Manager",
  "Branch Staff": "Branch Staff",
};

export function UserTable() {
  const users = useQuery(api.queries.listUsers.listUsers) as
    | UserWithBranches[]
    | undefined;
  const deactivateUser = useMutation(
    api.mutations.deactivateUser.deactivateUser
  );

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithBranches | null>(null);
  const [deactivateTarget, setDeactivateTarget] =
    useState<UserWithBranches | null>(null);

  const handleDeactivateConfirm = async () => {
    if (!deactivateTarget) return;
    try {
      await deactivateUser({ userId: deactivateTarget._id as Id<"users"> });
      toast.success(`${deactivateTarget.name} has been deactivated`);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to deactivate user"
      );
    } finally {
      setDeactivateTarget(null);
    }
  };

  if (users === undefined) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="rounded-lg border overflow-x-auto">
          <Table className="w-full text-sm">
            <caption className="sr-only">User management table</caption>
            <TableHeader>
              <TableRow className="border-b bg-muted/50">
                <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">Name</TableHead>
                <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">Email</TableHead>
                <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">Role</TableHead>
                <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">Branch(es)</TableHead>
                <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">Status</TableHead>
                <TableHead className="px-4 py-3" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3].map((i) => (
                <TableRow key={i} className="border-b last:border-0">
                  {[1, 2, 3, 4, 5, 6].map((j) => (
                    <TableCell key={j} className="px-4 py-3">
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() => {
            setEditingUser(null);
            setSheetOpen(true);
          }}
        >
          Add User
        </Button>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table className="w-full text-sm">
          <caption className="sr-only">User management table</caption>
          <TableHeader>
            <TableRow className="border-b bg-muted/50">
              <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">
                Name
              </TableHead>
              <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">
                Email
              </TableHead>
              <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">
                Role
              </TableHead>
              <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">
                Branch(es)
              </TableHead>
              <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="px-4 py-3" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  No users found. Click "Add User" to create one.
                </TableCell>
              </TableRow>
            )}
            {users.map((user) => (
              <TableRow key={user._id} className="border-b last:border-0 hover:bg-muted/50">
                <TableCell className="px-4 py-3 font-medium">{user.name}</TableCell>
                <TableCell className="px-4 py-3 text-muted-foreground">{user.email}</TableCell>
                <TableCell className="px-4 py-3">
                  <Badge variant="outline">
                    {ROLE_LABELS[user.role] ?? user.role}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3 text-muted-foreground">
                  {user.role === "Admin"
                    ? "—"
                    : user.branchNames.length > 0
                    ? user.branchNames.join(", ")
                    : "None assigned"}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Badge variant={user.isActive ? "default" : "secondary"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingUser(user);
                        setSheetOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    {user.isActive && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeactivateTarget(user)}
                      >
                        Deactivate
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <UserFormSheet
        mode={editingUser ? "edit" : "create"}
        user={editingUser ?? undefined}
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setEditingUser(null);
        }}
      />

      <AlertDialog
        open={!!deactivateTarget}
        onOpenChange={(open) => {
          if (!open) setDeactivateTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate user?</AlertDialogTitle>
            <AlertDialogDescription>
              {deactivateTarget?.name} ({deactivateTarget?.email}) will no
              longer be able to log in. Their historical data will be
              preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivateConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
