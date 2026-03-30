"use client";

import { useRef, useState, useLayoutEffect } from "react";
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
      fc: "#a855f7",
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(100);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      setHeight(entries[0]?.contentRect.height ?? 100);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Layout modes based on height
  const isCompact = height < 36;
  const isMedium = height >= 36 && height < 60;

  const timeStr = `${format(parseISO(event.startTime), "HH:mm")} – ${format(parseISO(event.endTime), "HH:mm")}`;

  return (
    <div
      ref={containerRef}
      className={cn(
        "h-full rounded border-l-[3px] overflow-hidden cursor-pointer transition-shadow hover:shadow-md",
        colors.border,
        colors.bg
      )}
    >
      {/* Compact layout: single line */}
      {isCompact && (
        <div className="h-full px-1.5 flex items-center gap-1.5 overflow-hidden">
          <span className={cn("text-[10px] font-semibold shrink-0", colors.text)}>
            {format(parseISO(event.startTime), "HH:mm")}
          </span>
          <span className="text-[10px] font-medium text-gray-900 truncate">
            {event.title}
          </span>
        </div>
      )}

      {/* Medium layout: time + title same area */}
      {isMedium && (
        <div className="h-full px-1.5 py-1 flex flex-col justify-center overflow-hidden">
          <div className="flex items-baseline gap-1.5">
            <span className={cn("text-[10px] font-semibold shrink-0", colors.text)}>
              {timeStr}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-gray-900 truncate leading-tight">
            {event.title}
          </span>
        </div>
      )}

      {/* Full layout: stacked with bottom info */}
      {!isCompact && !isMedium && (
        <div className="h-full p-1.5 flex flex-col justify-between">
          <div>
            <p className={cn("text-[10px] font-semibold leading-tight", colors.text)}>
              {timeStr}
            </p>
            <h4 className="font-semibold text-gray-900 text-[11px] mt-0.5 line-clamp-2 leading-tight">
              {event.title}
            </h4>
          </div>
          {/* Bottom row: tag / participants / recurrence */}
          <div className="flex items-center justify-between gap-1 mt-1">
            {event.tag && (
              <span className={cn("text-[9px] font-bold px-1 py-0.5 rounded truncate", colors.tagBg)}>
                {event.tag}
              </span>
            )}
            <div className="flex items-center gap-1 ml-auto">
              {event.recurrenceRule && <Repeat className={cn("w-2.5 h-2.5 shrink-0", colors.text)} />}
              {event.participants && (
                <span className="text-[9px] text-gray-500">+{event.participants}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
