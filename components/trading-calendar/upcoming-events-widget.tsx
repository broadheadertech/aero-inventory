"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS, formatEventDateShort } from "@/components/trading-calendar/event-constants";
import { Calendar } from "lucide-react";
import Link from "next/link";

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function UpcomingEventsWidget() {
  const events = useQuery(api.queries.getUpcomingEvents.getUpcomingEvents, {
    limit: 5,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">
          <Calendar className="mr-2 inline h-4 w-4" />
          Upcoming Events
        </CardTitle>
        <Link
          href="/trading-calendar"
          className="text-xs text-muted-foreground hover:underline"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {events === undefined ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming events</p>
        ) : (
          <div className="space-y-2">
            {events.map((event) => {
              const days = daysUntil(event.startDate);
              return (
                <div
                  key={event._id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${EVENT_TYPE_COLORS[event.eventType]}`}
                    >
                      {EVENT_TYPE_LABELS[event.eventType]}
                    </Badge>
                    <span className="text-sm font-medium">{event.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatEventDateShort(event.startDate)}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {days === 0
                        ? "Today"
                        : days === 1
                          ? "Tomorrow"
                          : `${days}d`}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
