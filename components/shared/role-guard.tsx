"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";

type RoleGuardProps = {
  allowedRoles: string[];
  children: React.ReactNode;
};

/**
 * RoleGuard — redirects users to the correct dashboard if they don't have the right role.
 * Prevents admin pages from crashing when accessed by Branch Manager/Staff.
 */
export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const currentRole = useQuery(api.queries.getCurrentUserRole.getCurrentUserRole);

  // Still loading
  if (currentRole === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    );
  }

  // Not authenticated or no role
  if (currentRole === null) {
    window.location.href = "/";
    return null;
  }

  // Wrong role — redirect to correct dashboard
  if (!allowedRoles.includes(currentRole)) {
    switch (currentRole) {
      case "Admin":
        window.location.href = "/dashboard";
        break;
      case "Branch Manager":
        window.location.href = "/manager/dashboard";
        break;
      case "Branch Staff":
        window.location.href = "/staff/sales-entry";
        break;
      default:
        window.location.href = "/";
    }
    return null;
  }

  return <>{children}</>;
}
