"use client";

import { useState, useMemo, useCallback } from "react";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from "@/components/trading-calendar/event-constants";
import { ChevronLeft, ChevronRight, CalendarDays, List } from "lucide-react";

type CalendarViewProps = {
  events: Doc<"tradingEvents">[];
  onEventClick: (event: Doc<"tradingEvents">) => void;
};

type ViewMode = "month" | "week";

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDays(startOfWeek: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "long",
  }).format(date);
}

function formatWeekRange(start: Date): string {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
  });
  return `${fmt.format(start)} – ${fmt.format(end)}, ${end.getFullYear()}`;
}

function formatDayHeader(date: Date): string {
  return new Intl.DateTimeFormat("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarView({ events, onEventClick }: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const navigateBack = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === "month") {
        d.setMonth(d.getMonth() - 1);
      } else {
        d.setDate(d.getDate() - 7);
      }
      return d;
    });
  };

  const navigateForward = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === "month") {
        d.setMonth(d.getMonth() + 1);
      } else {
        d.setDate(d.getDate() + 7);
      }
      return d;
    });
  };

  const goToToday = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    setCurrentDate(now);
  };

  // Pre-compute event ranges once per events change — avoids O(days × events) Date allocations per render
  const eventsByDateKey = useMemo(() => {
    const map = new Map<string, Doc<"tradingEvents">[]>();
    for (const event of events) {
      const start = new Date(event.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(event.endDate);
      end.setHours(0, 0, 0, 0);
      const cursor = new Date(start);
      while (cursor <= end) {
        const key = cursor.toISOString().split("T")[0];
        const list = map.get(key) ?? [];
        list.push(event);
        map.set(key, list);
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    return map;
  }, [events]);

  const getEventsForDay = useCallback(
    (day: Date): Doc<"tradingEvents">[] => {
      const key = day.toISOString().split("T")[0];
      return eventsByDateKey.get(key) ?? [];
    },
    [eventsByDateKey]
  );

  // Month view
  const monthDays = useMemo(() => {
    return getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  }, [currentDate]);

  const monthStartPadding = useMemo(() => {
    return monthDays[0]?.getDay() ?? 0;
  }, [monthDays]);

  const monthEndPadding = useMemo(() => {
    const totalCells = monthStartPadding + monthDays.length;
    const remainder = totalCells % 7;
    return remainder === 0 ? 0 : 7 - remainder;
  }, [monthStartPadding, monthDays]);

  // Week view
  const weekStart = useMemo(() => getStartOfWeek(currentDate), [currentDate]);
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  return (
    <div className="space-y-4">
      {/* Navigation bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={navigateBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={navigateForward}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <h2 className="ml-2 text-lg font-semibold">
            {viewMode === "month"
              ? formatMonthYear(currentDate)
              : formatWeekRange(weekStart)}
          </h2>
        </div>
        <div className="flex items-center gap-1 rounded-md border p-1">
          <Button
            variant={viewMode === "month" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("month")}
          >
            <CalendarDays className="mr-1 h-4 w-4" />
            Month
          </Button>
          <Button
            variant={viewMode === "week" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("week")}
          >
            <List className="mr-1 h-4 w-4" />
            Week
          </Button>
        </div>
      </div>

      {/* Month View */}
      {viewMode === "month" && (
        <div className="rounded-md border">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b bg-muted/50">
            {DAY_NAMES.map((day) => (
              <div
                key={day}
                className="px-2 py-2 text-center text-xs font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>
          {/* Day grid */}
          <div className="grid grid-cols-7">
            {/* Padding for days before month start */}
            {Array.from({ length: monthStartPadding }).map((_, i) => (
              <div key={`pad-${i}`} className="min-h-[80px] border-b border-r bg-muted/20" />
            ))}
            {/* Actual days */}
            {monthDays.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isToday = isSameDay(day, today);
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[80px] border-b border-r p-1 ${
                    isToday ? "bg-blue-50 dark:bg-blue-950/30" : ""
                  }`}
                >
                  <div
                    className={`mb-1 text-xs font-medium ${
                      isToday
                        ? "flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white"
                        : "text-muted-foreground"
                    }`}
                  >
                    {day.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((event) => (
                      <button
                        key={event._id}
                        type="button"
                        onClick={() => onEventClick(event)}
                        className={`w-full truncate rounded px-1 py-0.5 text-left text-[10px] font-medium ${
                          EVENT_TYPE_COLORS[event.eventType]
                        }`}
                      >
                        {event.name}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-muted-foreground">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {/* Trailing padding for incomplete last row */}
            {Array.from({ length: monthEndPadding }).map((_, i) => (
              <div key={`pad-end-${i}`} className="min-h-[80px] border-b border-r bg-muted/20" />
            ))}
          </div>
        </div>
      )}

      {/* Week View */}
      {viewMode === "week" && (
        <div className="space-y-2">
          {weekDays.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isToday = isSameDay(day, today);
            return (
              <div
                key={day.toISOString()}
                className={`rounded-md border p-3 ${isToday ? "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/30" : ""}`}
              >
                <div className="mb-2 text-sm font-medium">
                  {formatDayHeader(day)}
                  {isToday && (
                    <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                      Today
                    </Badge>
                  )}
                </div>
                {dayEvents.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No events</p>
                ) : (
                  <div className="space-y-1">
                    {dayEvents.map((event) => (
                      <button
                        key={event._id}
                        type="button"
                        onClick={() => onEventClick(event)}
                        className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${
                          EVENT_TYPE_COLORS[event.eventType]
                        }`}
                      >
                        <span className="font-medium">{event.name}</span>
                        <Badge variant="outline" className="ml-auto text-[10px]">
                          {EVENT_TYPE_LABELS[event.eventType]}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
