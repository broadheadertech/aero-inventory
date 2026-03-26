"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { useRouter, usePathname } from "next/navigation";
import { Globe, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NotificationItemProps {
  notification: Doc<"notifications">;
  onClose: () => void;
}

function formatRelativeTime(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const markRead = useMutation(
    api.mutations.markNotificationRead.markNotificationRead
  );
  const router = useRouter();
  const pathname = usePathname();

  async function handleClick() {
    try {
      // M3: skip mutation if already read — avoids wasteful round-trip
      if (!notification.isRead) {
        await markRead({ notificationId: notification._id });
      }

      // M2: determine dashboard by role; Staff don't receive these notifications
      // but guard defensively — they stay at their current path
      const isManager = pathname.startsWith("/manager");
      if (pathname.startsWith("/staff")) {
        // Branch Staff have no slow-mover dashboard — close panel only
        onClose();
        return;
      }

      if (notification.type === "network_slow_mover") {
        router.push("/dashboard");
      } else {
        router.push(isManager ? "/manager/dashboard" : "/dashboard");
      }

      onClose();
    } catch {
      // M1: surface error to user instead of silent failure
      toast.error("Failed to open notification");
    }
  }

  const Icon =
    notification.type === "network_slow_mover" ? Globe : TrendingDown;

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
        !notification.isRead && "bg-muted/30"
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 h-4 w-4 flex-none",
          notification.isRead ? "text-muted-foreground" : "text-foreground"
        )}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm",
            !notification.isRead ? "font-medium text-foreground" : "text-muted-foreground"
          )}
        >
          {notification.title}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
          {notification.message}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>
      {!notification.isRead && (
        <span className="mt-1.5 h-2 w-2 flex-none rounded-full bg-primary" aria-label="Unread" />
      )}
    </button>
  );
}
