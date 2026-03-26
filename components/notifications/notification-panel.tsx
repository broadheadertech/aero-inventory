"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { NotificationItem } from "./notification-item";
import { CheckCheck } from "lucide-react";
import { toast } from "sonner";

interface NotificationPanelProps {
  notifications: Doc<"notifications">[];
  onClose: () => void;
}

export function NotificationPanel({
  notifications,
  onClose,
}: NotificationPanelProps) {
  const markAllRead = useMutation(
    api.mutations.markAllNotificationsRead.markAllNotificationsRead
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  async function handleMarkAllRead() {
    try {
      await markAllRead({});
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark notifications as read");
    }
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-sm font-semibold">Notifications</p>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
            onClick={handleMarkAllRead}
          >
            <CheckCheck className="mr-1 h-3 w-3" aria-hidden="true" />
            Mark all as read
          </Button>
        )}
      </div>
      <Separator />

      {/* Notification list */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No notifications
          </p>
        ) : (
          notifications.map((n) => (
            <NotificationItem key={n._id} notification={n} onClose={onClose} />
          ))
        )}
      </div>
    </div>
  );
}
