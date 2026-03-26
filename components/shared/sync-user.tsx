"use client";

import { useEffect } from "react";
import { useConvexAuth, useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";

/**
 * SyncUser — side-effect component that syncs Clerk user to Convex on login.
 *
 * Renders nothing. Calls syncUser mutation once when isAuthenticated becomes
 * true. The mutation is idempotent — safe to call on every page load.
 *
 * On error (e.g. "No role assigned"), surfaces a toast so users are not left
 * in a silent broken state.
 *
 * Place inside <ConvexClientProvider> in root layout so it runs for all routes.
 */
export function SyncUser() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const syncUser = useMutation(api.mutations.syncUser.syncUser);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      syncUser().catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Failed to sync user account.";
        toast.error(message);
      });
    }
  }, [isAuthenticated, isLoading, syncUser]);

  return null;
}
