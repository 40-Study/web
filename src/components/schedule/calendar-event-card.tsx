"use client";

import { format, parseISO } from "date-fns";
import { Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScheduleEvent } from "./week-calendar-grid";

/** Color palette per event type/status */
export function getEventColor(event: ScheduleEvent) {
  if (event.tag === "GIAO VIỆC" || event.type === "hybrid") {
    return {
      border: "border-l-purple-500",
      bg: "bg-purple-50",
      text: "text-purple-700",
      tagBg: "bg-purple-100 text-purple-700",
      fc: "#a855f7", // FullCalendar backgroundColor
    };
  }
  if (event.status === "ongoing") {
    return {
      border: "border-l-red-500",
      bg: "bg-red-50",
      text: "text-red-700",
      tagBg: "bg-red-100 text-red-700",
      fc: "#ef4444",
    };
  }
  if (event.status === "completed") {
    return {
      border: "border-l-green-500",
      bg: "bg-green-50",
      text: "text-green-700",
      tagBg: "bg-green-100 text-green-700",
      fc: "#22c55e",
    };
  }
  return {
    border: "border-l-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-700",
    tagBg: "bg-blue-100 text-blue-700",
    fc: "#3b82f6",
  };
}

interface CalendarEventCardProps {
  event: ScheduleEvent;
}

/** Event card rendered inside FullCalendar eventContent */
export default function CalendarEventCard({ event }: CalendarEventCardProps) {
  const colors = getEventColor(event);

  return (
    <div
      className={cn(
        "h-full rounded-lg border-l-4 overflow-hidden cursor-pointer transition-all hover:shadow-md",
        colors.border,
        colors.bg
      )}
    >
      <div className="h-full p-2 flex flex-col justify-between">
        <div>
          {/* Time range */}
          <p className={cn("text-[11px] font-semibold", colors.text)}>
            {format(parseISO(event.startTime), "HH:mm")} –{" "}
            {format(parseISO(event.endTime), "HH:mm")}
          </p>
          {/* Title */}
          <h4 className="font-semibold text-gray-900 text-xs mt-0.5 line-clamp-2">
            {event.title}
          </h4>
        </div>

        {/* Bottom row: tag / participants / recurrence icon */}
        <div className="flex items-center justify-between mt-1 gap-1">
          {event.tag && (
            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded truncate", colors.tagBg)}>
              {event.tag}
            </span>
          )}
          <div className="flex items-center gap-1 ml-auto">
            {event.recurrenceRule && (
              <Repeat className={cn("w-3 h-3 shrink-0", colors.text)} />
            )}
            {event.participants && (
              <span className="text-[10px] text-gray-500">+{event.participants}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
