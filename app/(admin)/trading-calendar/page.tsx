"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { EventForm } from "@/components/trading-calendar/event-form";
import { CalendarView } from "@/components/trading-calendar/calendar-view";
import { EventDetailDialog } from "@/components/trading-calendar/event-detail-dialog";
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS, formatEventDate } from "@/components/trading-calendar/event-constants";
import { Bell, CalendarDays, CalendarPlus, Eye, Pencil, TableIcon, Trash2 } from "lucide-react";

function isInReminderWindow(event: Doc<"tradingEvents">): boolean {
  if (!event.reminderDaysBefore) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(event.startDate);
  start.setHours(0, 0, 0, 0);
  const reminderDate = new Date(start);
  reminderDate.setDate(reminderDate.getDate() - event.reminderDaysBefore);
  return today >= reminderDate && today < start;
}

export default function TradingCalendarPage() {
  const { toast } = useToast();
  const events = useQuery(api.queries.listTradingEvents.listTradingEvents, {});
  const deleteEvent = useMutation(
    api.mutations.deleteTradingEvent.deleteTradingEvent
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Doc<"tradingEvents"> | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<Doc<"tradingEvents"> | null>(
    null
  );
  const [pageView, setPageView] = useState<"table" | "calendar">("calendar");
  const [detailEvent, setDetailEvent] = useState<Doc<"tradingEvents"> | null>(null);

  const handleEdit = (event: Doc<"tradingEvents">) => {
    setEditingEvent(event);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingEvent(null);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEvent({ eventId: deleteTarget._id });
      toast({ title: "Event deleted successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete event",
        variant: "destructive",
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Trading Calendar
          </h1>
          <p className="text-muted-foreground">
            Plan seasonal events, markdowns, and promotions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border p-1">
            <Button
              variant={pageView === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setPageView("table")}
            >
              <TableIcon className="mr-1 h-4 w-4" />
              Table
            </Button>
            <Button
              variant={pageView === "calendar" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setPageView("calendar")}
            >
              <CalendarDays className="mr-1 h-4 w-4" />
              Calendar
            </Button>
          </div>
          <Button onClick={handleCreate}>
            <CalendarPlus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </div>
      </div>

      {events === undefined ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">No trading events yet.</p>
          <p className="text-sm text-muted-foreground">
            Create your first event to start planning.
          </p>
        </div>
      ) : pageView === "calendar" ? (
        <CalendarView events={events} onEventClick={setDetailEvent} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Triggers</TableHead>
              <TableHead>Reminder</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event._id}>
                <TableCell className="font-medium">{event.name}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={EVENT_TYPE_COLORS[event.eventType]}
                  >
                    {EVENT_TYPE_LABELS[event.eventType]}
                  </Badge>
                </TableCell>
                <TableCell>{formatEventDate(event.startDate)}</TableCell>
                <TableCell>{formatEventDate(event.endDate)}</TableCell>
                <TableCell>
                  {event.actions.length > 0
                    ? `${event.actions.length} action${event.actions.length > 1 ? "s" : ""}`
                    : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {event.reminderDaysBefore
                      ? `${event.reminderDaysBefore} days`
                      : "—"}
                    {isInReminderWindow(event) && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                        <Bell className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDetailEvent(event)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(event)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(event)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <EventDetailDialog
        event={detailEvent}
        open={!!detailEvent}
        onOpenChange={(open) => !open && setDetailEvent(null)}
        onEdit={(event) => {
          setDetailEvent(null);
          handleEdit(event);
        }}
      />

      <EventForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editingEvent={editingEvent}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trading Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
