"use client";

import { useState } from "react";
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  format,
  eachDayOfInterval,
  isSameDay,
  isToday,
  parseISO,
  differenceInMinutes,
} from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ScheduleEvent {
  id: string;
  title: string;
  courseId?: string;
  startTime: string;
  endTime: string;
  type: "video" | "livestream" | "hybrid";
  status: "completed" | "ongoing" | "upcoming";
  meetingUrl?: string;
  teacher?: string;
  location?: string;
  description?: string;
}

interface WeekCalendarGridProps {
  events: ScheduleEvent[];
  title: string;
  subtitle?: string;
  editable?: boolean;
  /** Called when clicking an empty cell (for creating events) */
  onCellClick?: (day: Date, hour: number) => void;
  /** Called when clicking an event (for editing) */
  onEventClick?: (event: ScheduleEvent) => void;
  /** Render custom content inside event card (default: built-in card) */
  renderEventCard?: (event: ScheduleEvent, isHovered: boolean) => React.ReactNode;
  /** Render custom tooltip on hover */
  renderEventTooltip?: (event: ScheduleEvent) => React.ReactNode;
  /** Custom header actions (right side) */
  headerActions?: React.ReactNode;
}

const TIME_SLOTS = Array.from({ length: 14 }, (_, i) => i + 7);
const SLOT_HEIGHT = 72;

export function getEventPosition(event: ScheduleEvent) {
  const start = parseISO(event.startTime);
  const end = parseISO(event.endTime);
  const startHour = start.getHours() + start.getMinutes() / 60;
  const duration = differenceInMinutes(end, start) / 60;
  const top = (startHour - 7) * SLOT_HEIGHT;
  const height = duration * SLOT_HEIGHT;
  return { top, height };
}

export default function WeekCalendarGrid({
  events,
  title,
  subtitle,
  editable = false,
  onCellClick,
  onEventClick,
  renderEventCard,
  renderEventTooltip,
  headerActions,
}: WeekCalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getEventsForDay = (day: Date) =>
    events.filter((event) => isSameDay(parseISO(event.startTime), day));

  const handleCellClick = (day: Date, hour: number) => {
    if (editable && onCellClick) {
      onCellClick(day, hour);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-4">
          {headerActions}
          {/* Date Navigation */}
          <div className="flex items-center gap-1 rounded-xl border bg-white dark:bg-gray-800 px-3 py-2 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[160px] text-center">
              {format(weekStart, "dd MMM", { locale: vi })} -{" "}
              {format(weekEnd, "dd MMM yyyy", { locale: vi })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-gradient-to-br from-green-400 to-green-600" />
          <span className="text-gray-600 dark:text-gray-300">Đã hoàn thành</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-gradient-to-br from-red-400 to-red-600 animate-pulse" />
          <span className="text-gray-600 dark:text-gray-300">Đang diễn ra</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 to-blue-600" />
          <span className="text-gray-600 dark:text-gray-300">Sắp diễn ra</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="overflow-hidden border shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[900px] calendar-container relative">
            {/* Day Headers */}
            <div className="grid grid-cols-8 bg-gray-50 dark:bg-gray-900/50 border-b">
              <div className="p-4 text-center text-sm font-medium text-gray-400" />
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "p-4 text-center border-l transition-all",
                    isToday(day)
                      ? "bg-gradient-to-b from-primary-600 to-primary-700 text-white"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  )}
                >
                  <div
                    className={cn(
                      "text-xs uppercase tracking-wider",
                      isToday(day) ? "text-white/80" : "text-gray-400"
                    )}
                  >
                    {isToday(day) ? "Hôm nay" : format(day, "EEEE", { locale: vi })}
                  </div>
                  <div
                    className={cn(
                      "text-2xl font-bold mt-1",
                      isToday(day) ? "text-white" : "text-gray-900 dark:text-white"
                    )}
                  >
                    {format(day, "d")}
                  </div>
                  <div
                    className={cn(
                      "text-xs mt-1",
                      isToday(day) ? "text-white/70" : "text-gray-400"
                    )}
                  >
                    {format(day, "MMM", { locale: vi })}
                  </div>
                </div>
              ))}
            </div>

            {/* Time Grid */}
            <div className="relative" onClick={() => setHoveredEventId(null)}>
              {TIME_SLOTS.map((hour) => (
                <div
                  key={hour}
                  className="grid grid-cols-8 border-b border-gray-100 dark:border-gray-800"
                  style={{ height: SLOT_HEIGHT }}
                >
                  <div className="p-3 text-sm text-gray-400 text-right pr-4 border-r border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
                    <span className="font-medium">
                      {String(hour).padStart(2, "0")}:00
                    </span>
                  </div>
                  {weekDays.map((day) => (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "relative border-l border-gray-100 dark:border-gray-800 transition-colors",
                        editable
                          ? "hover:bg-primary-50/50 dark:hover:bg-primary-900/20 cursor-pointer group"
                          : "hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCellClick(day, hour);
                      }}
                    >
                      {/* "+" indicator on hover for editable mode */}
                      {editable && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <Plus className="w-4 h-4 text-primary-400" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}

              {/* Events Overlay */}
              {weekDays.map((day, dayIndex) => {
                const dayEvents = getEventsForDay(day);
                return dayEvents.map((event) => {
                  const { top, height } = getEventPosition(event);
                  const leftOffset = (dayIndex + 1) * (100 / 8);
                  const isHovered = hoveredEventId === event.id;

                  return (
                    <div
                      key={event.id}
                      className="absolute"
                      style={{
                        top: top + 2,
                        height: height - 4,
                        left: `calc(${leftOffset}% + 4px)`,
                        width: `calc(${100 / 8}% - 10px)`,
                        zIndex: isHovered ? 20 : 10,
                      }}
                      onMouseEnter={() => setHoveredEventId(event.id)}
                      onMouseLeave={() => setHoveredEventId(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                    >
                      {renderEventCard ? (
                        renderEventCard(event, isHovered)
                      ) : (
                        <DefaultEventCard event={event} />
                      )}

                      {/* Tooltip */}
                      {isHovered && renderEventTooltip && (
                        <div
                          className="absolute left-full top-0 ml-2 z-50"
                          onMouseEnter={() => setHoveredEventId(event.id)}
                          onMouseLeave={() => setHoveredEventId(null)}
                        >
                          {renderEventTooltip(event)}
                        </div>
                      )}
                    </div>
                  );
                });
              })}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

/** Default event card with status-based gradient styling */
function DefaultEventCard({ event }: { event: ScheduleEvent }) {
  return (
    <div
      className={cn(
        "h-full rounded-lg cursor-pointer transition-all duration-200",
        "hover:shadow-lg",
        event.status === "completed" &&
          "bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200",
        event.status === "ongoing" &&
          "bg-gradient-to-br from-white to-red-50 border-2 border-red-400 shadow-md shadow-red-100",
        event.status === "upcoming" &&
          "bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200"
      )}
    >
      <div className="h-full p-2 flex flex-col justify-between">
        <h4 className="font-semibold text-gray-900 dark:text-white text-xs line-clamp-1">
          {event.title}
        </h4>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span>
            {format(parseISO(event.startTime), "HH:mm")} -{" "}
            {format(parseISO(event.endTime), "HH:mm")}
          </span>
        </div>
      </div>
    </div>
  );
}
