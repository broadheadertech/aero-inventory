"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Shield, Store, User, ChevronUp, X } from "lucide-react";

const roles = [
  { role: "Admin", icon: Shield, path: "/dashboard", color: "bg-red-500", needsBranch: false },
  { role: "Branch Manager", icon: Store, path: "/manager/dashboard", color: "bg-blue-500", needsBranch: true },
  { role: "Branch Staff", icon: User, path: "/staff/sales-entry", color: "bg-green-500", needsBranch: true },
] as const;

export function RoleSwitcher() {
  const currentRole = useQuery(api.queries.getCurrentUserRole.getCurrentUserRole);
  const isAuthenticated = currentRole !== undefined && currentRole !== null;
  const branches = useQuery(api.queries.listAllBranches.listAllBranches, isAuthenticated ? {} : "skip");
  const switchRole = useMutation(api.mutations.switchRole.switchRole);

  const [showBranchPicker, setShowBranchPicker] = useState(false);
  const [pendingRole, setPendingRole] = useState<typeof roles[number] | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [switching, setSwitching] = useState(false);

  // Still loading
  if (currentRole === undefined) return null;

  // Switching in progress
  if (switching) {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-lg">
        <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
        Switching...
      </div>
    );
  }

  // Authenticated but no role assigned
  if (currentRole === null) {
    return (
      <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 shadow-lg dark:border-amber-800 dark:bg-amber-950">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">No role assigned</p>
        <p className="text-xs text-amber-600 dark:text-amber-400">Contact your administrator to get access.</p>
      </div>
    );
  }

  const doSwitch = (role: string, path: string, branchId?: Id<"branches">) => {
    setSwitching(true);
    switchRole({ role, branchId })
      .then(() => {
        // Give Convex time to propagate before loading the new page
        setTimeout(() => {
          window.location.href = path;
        }, 1000);
      })
      .catch((err) => {
        console.error("Role switch failed:", err);
        setSwitching(false);
      });
  };

  const handleRoleClick = (roleConfig: typeof roles[number]) => {
    if (roleConfig.role === currentRole && !roleConfig.needsBranch) return;

    if (roleConfig.needsBranch) {
      setPendingRole(roleConfig);
      setShowBranchPicker(true);
    } else {
      doSwitch(roleConfig.role, roleConfig.path);
    }
  };

  const handleBranchSelect = (branchId: Id<"branches">) => {
    if (!pendingRole) return;
    const { role, path } = pendingRole;
    setShowBranchPicker(false);
    setPendingRole(null);
    doSwitch(role, path, branchId);
  };

  // Collapsed badge
  if (!expanded) {
    const current = roles.find((r) => r.role === currentRole);
    const Icon = current?.icon ?? Shield;
    return (
      <button
        onClick={() => setExpanded(true)}
        className={cn(
          "fixed bottom-4 right-4 z-50 flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-white shadow-lg transition-all hover:scale-105",
          current?.color ?? "bg-gray-500"
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        <span>{currentRole}</span>
        <ChevronUp className="h-3 w-3 opacity-60" />
      </button>
    );
  }

  return (
    <>
      {/* Branch picker overlay */}
      {showBranchPicker && (
        <div className="fixed inset-0 z-[60] flex items-end justify-end p-4">
          <div className="absolute inset-0 bg-black/20" onClick={() => { setShowBranchPicker(false); setPendingRole(null); }} />
          <div className="relative mb-16 w-64 rounded-lg border bg-card p-3 shadow-xl">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">Login as {pendingRole?.role}</p>
              <button onClick={() => { setShowBranchPicker(false); setPendingRole(null); }}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">Select a branch:</p>
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {branches?.filter((b) => b.type !== "warehouse").map((branch) => (
                <button
                  key={branch._id}
                  onClick={() => handleBranchSelect(branch._id)}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                >
                  <Store className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{branch.name}</span>
                </button>
              ))}
              {(!branches || branches.filter((b) => b.type !== "warehouse").length === 0) && (
                <p className="px-3 py-2 text-xs text-muted-foreground">No branches found.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Role switcher panel */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
        <div className="rounded-lg border bg-card p-2 shadow-lg">
          <div className="mb-1.5 flex items-center justify-between px-1">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Switch Role</span>
            <button onClick={() => setExpanded(false)}>
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
          <div className="space-y-0.5">
            {roles.map((roleConfig) => {
              const { role, icon: Icon, color, needsBranch } = roleConfig;
              return (
                <button
                  key={role}
                  onClick={() => handleRoleClick(roleConfig)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all",
                    currentRole === role
                      ? `${color} text-white`
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{role}</span>
                  {needsBranch && currentRole !== role && (
                    <Store className="ml-auto h-3 w-3 opacity-40" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
