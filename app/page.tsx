"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const router = useRouter();

  // Query current user's role from Convex — add timestamp to bust cache on role switch
  const [cacheKey] = useState(() => Date.now());
  const userRole = useQuery(
    api.queries.getCurrentUserRole.getCurrentUserRole,
    isAuthenticated ? {} : "skip"
  );

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      window.location.href = "/sign-in";
      return;
    }

    if (userRole === undefined) return; // Still loading

    if (userRole === null) {
      // User not yet synced to Convex — SyncUser component will handle it
      const timer = setTimeout(() => { window.location.href = "/no-role"; }, 2000);
      return () => clearTimeout(timer);
    }

    switch (userRole) {
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
        window.location.href = "/no-role";
    }
  }, [authLoading, isAuthenticated, userRole, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-4 w-64">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
  );
}
