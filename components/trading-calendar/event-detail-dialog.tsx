"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS, formatEventDateLong } from "@/components/trading-calendar/event-constants";
import { useState } from "react";
import { Bell, Pencil, Store, Tag, Trash2 } from "lucide-react";

type EventDetailDialogProps = {
  event: Doc<"tradingEvents"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (event: Doc<"tradingEvents">) => void;
};

export function EventDetailDialog({
  event,
  open,
  onOpenChange,
  onEdit,
}: EventDetailDialogProps) {
  const { toast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const branches = useQuery(
    api.queries.listBranches.listBranches,
    open ? {} : "skip"
  );
  const deleteEvent = useMutation(
    api.mutations.deleteTradingEvent.deleteTradingEvent
  );

  if (!event) return null;

  const linkedBranches = branches?.filter((b) =>
    (event.linkedBranchIds as string[]).includes(b._id)
  );

  const hasProductFilters =
    event.linkedProductFilters &&
    (event.linkedProductFilters.department ||
      event.linkedProductFilters.category ||
      event.linkedProductFilters.collection);

  const handleDelete = async () => {
    try {
      await deleteEvent({ eventId: event._id });
      toast({ title: "Event deleted successfully" });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete event",
        variant: "destructive",
      });
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle>{event.name}</DialogTitle>
              <Badge
                variant="secondary"
                className={EVENT_TYPE_COLORS[event.eventType]}
              >
                {EVENT_TYPE_LABELS[event.eventType]}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Date range */}
            <div className="text-sm">
              <span className="font-medium">Date: </span>
              {formatEventDateLong(event.startDate)}
              {event.startDate !== event.endDate &&
                ` – ${formatEventDateLong(event.endDate)}`}
            </div>

            {/* Description */}
            <div className="text-sm">
              <span className="font-medium">Description: </span>
              {event.description}
            </div>

            {/* Reminder */}
            {event.reminderDaysBefore && (
              <div className="flex items-center gap-2 text-sm">
                <Bell className="h-4 w-4 text-amber-600" />
                <span>Reminder {event.reminderDaysBefore} days before</span>
              </div>
            )}

            {/* Action triggers */}
            {event.actions.length > 0 && (
              <div>
                <span className="text-sm font-medium">
                  Action Triggers ({event.actions.length}):
                </span>
                <div className="mt-1 space-y-1">
                  {event.actions.map((action, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded border px-2 py-1 text-sm"
                    >
                      <Tag className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium capitalize">
                        {action.type}
                      </span>
                      <span className="text-muted-foreground">
                        {action.value}
                      </span>
                      {action.description && (
                        <span className="text-xs text-muted-foreground">
                          — {action.description}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Linked branches */}
            {linkedBranches && linkedBranches.length > 0 && (
              <div>
                <span className="text-sm font-medium">Linked Branches:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {linkedBranches.map((branch) => (
                    <Badge key={branch._id} variant="outline">
                      <Store className="mr-1 h-3 w-3" />
                      {branch.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Linked product filters */}
            {hasProductFilters && (
              <div>
                <span className="text-sm font-medium">Product Filters:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {event.linkedProductFilters?.department && (
                    <Badge variant="secondary">
                      Dept: {event.linkedProductFilters.department}
                    </Badge>
                  )}
                  {event.linkedProductFilters?.category && (
                    <Badge variant="secondary">
                      Cat: {event.linkedProductFilters.category}
                    </Badge>
                  )}
                  {event.linkedProductFilters?.collection && (
                    <Badge variant="secondary">
                      Collection: {event.linkedProductFilters.collection}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end gap-2 border-t pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onEdit(event);
                }}
              >
                <Pencil className="mr-1 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trading Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{event.name}&quot;? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
