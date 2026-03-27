"use client";

import { useMemo, useState } from "react";
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  format,
  eachDayOfInterval,
  isSameDay,
  isToday,
  parseISO,
  differenceInMinutes,
} from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Clock, CheckCircle, TrendingUp } from "lucide-react";
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
  /** Optional tag label shown on event card */
  tag?: string;
  /** Number of participants */
  participants?: number;
  /** Avatar URL of instructor/student */
  avatarUrl?: string;
}

type ViewMode = "day" | "week" | "month";

interface WeekCalendarGridProps {
  events: ScheduleEvent[];
  title?: string;
  subtitle?: string;
  editable?: boolean;
  onCellClick?: (day: Date, hour: number) => void;
  onEventClick?: (event: ScheduleEvent) => void;
  renderEventCard?: (event: ScheduleEvent, isHovered: boolean) => React.ReactNode;
  renderEventTooltip?: (event: ScheduleEvent) => React.ReactNode;
  headerActions?: React.ReactNode;
  /** Weekly stats displayed at bottom */
  stats?: {
    studyHours?: number;
    tasksCompleted?: number;
    tasksTotal?: number;
    focusPercent?: number;
  };
}

const SLOT_HEIGHT = 64;

/* Abbreviated Vietnamese day labels matching the design */
const DAY_LABELS = ["THL 2", "THL 3", "THL 4", "THL 5", "THL 6", "THL 7", "CN"];

const VIEW_OPTIONS: { id: ViewMode; label: string }[] = [
  { id: "day", label: "Ngày" },
  { id: "week", label: "Tuần" },
  { id: "month", label: "Tháng" },
];

export function getEventPosition(event: ScheduleEvent, startHourOffset = 7) {
  const start = parseISO(event.startTime);
  const end = parseISO(event.endTime);
  const startHour = start.getHours() + start.getMinutes() / 60;
  const duration = differenceInMinutes(end, start) / 60;
  const top = (startHour - startHourOffset) * SLOT_HEIGHT;
  const height = duration * SLOT_HEIGHT;
  return { top, height };
}

/** Event color based on type/status */
function getEventColor(event: ScheduleEvent) {
  if (event.tag === "GIAO VIỆC" || event.type === "hybrid") {
    return { border: "border-l-purple-500", bg: "bg-purple-50", text: "text-purple-700", tagBg: "bg-purple-100 text-purple-700" };
  }
  if (event.status === "ongoing") {
    return { border: "border-l-red-500", bg: "bg-red-50", text: "text-red-700", tagBg: "bg-red-100 text-red-700" };
  }
  if (event.status === "completed") {
    return { border: "border-l-green-500", bg: "bg-green-50", text: "text-green-700", tagBg: "bg-green-100 text-green-700" };
  }
  // Default: blue for upcoming / self-study
  return { border: "border-l-blue-500", bg: "bg-blue-50", text: "text-blue-700", tagBg: "bg-blue-100 text-blue-700" };
}

export default function WeekCalendarGrid({
  events,
  editable = false,
  onCellClick,
  onEventClick,
  renderEventCard,
  renderEventTooltip,
  headerActions,
  stats,
}: WeekCalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  /* Navigation based on view mode */
  const navigateBack = () => {
    if (viewMode === "day") setCurrentDate(subDays(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };
  const navigateForward = () => {
    if (viewMode === "day") setCurrentDate(addDays(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const dateRangeLabel = useMemo(() => {
    if (viewMode === "day") return format(currentDate, "dd/MM/yyyy");
    if (viewMode === "week") {
      return `${format(weekStart, "dd/MM/yyyy")} - ${format(weekEnd, "dd/MM/yyyy")}`;
    }
    const ms = startOfMonth(currentDate);
    const me = endOfMonth(currentDate);
    return `${format(ms, "dd/MM")} - ${format(me, "dd/MM/yyyy")}`;
  }, [currentDate, viewMode, weekStart, weekEnd]);

  const monthTitle = format(currentDate, "'Tháng' M, yyyy", { locale: vi });

  /* Time slots from 07:00 to 22:00 */
  const timeSlots = Array.from({ length: 16 }, (_, i) => i + 7);

  const getEventsForDay = (day: Date) =>
    events.filter((event) => isSameDay(parseISO(event.startTime), day));

  /* Days to render based on view mode */
  const visibleDays = viewMode === "day" ? [currentDate] : weekDays;
  const gridCols = viewMode === "day" ? "grid-cols-2" : "grid-cols-8";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{monthTitle}</h1>

        {/* Center: date range navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={navigateBack}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-gray-500" />
          </button>
          <span className="text-sm text-gray-600 min-w-[220px] text-center">
            {dateRangeLabel}
          </span>
          <button
            onClick={navigateForward}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Right: view toggle + actions */}
        <div className="flex items-center gap-3">
          <div className="flex rounded-full bg-gray-100 p-1">
            {VIEW_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setViewMode(opt.id)}
                className={cn(
                  "px-4 py-1.5 text-sm font-medium rounded-full transition-all",
                  viewMode === opt.id
                    ? "bg-primary-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {headerActions}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div className={cn("min-w-[900px]", viewMode === "day" && "min-w-0")}>
            {/* Day Headers */}
            <div className={cn("grid border-b", gridCols)}>
              {/* Time column header */}
              <div className="p-3 flex items-center justify-center">
                <Clock className="h-4 w-4 text-gray-400" />
              </div>
              {visibleDays.map((day, idx) => {
                const today = isToday(day);
                return (
                  <div
                    key={day.toISOString()}
                    className={cn("py-4 text-center border-l", today && "bg-primary-50")}
                  >
                    <div className="text-xs text-gray-400 font-medium tracking-wide">
                      {viewMode === "day"
                        ? format(day, "EEEE", { locale: vi }).toUpperCase()
                        : DAY_LABELS[idx]}
                    </div>
                    <div
                      className={cn(
                        "text-2xl font-bold mt-1",
                        today ? "text-primary-600" : "text-gray-900"
                      )}
                    >
                      {format(day, "d")}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time Grid */}
            <div className="relative" onClick={() => setHoveredEventId(null)}>
              {timeSlots.map((hour) => (
                <div
                  key={hour}
                  className={cn("grid border-b border-gray-100", gridCols)}
                  style={{ height: SLOT_HEIGHT }}
                >
                  {/* Time label */}
                  <div className="px-3 py-2 text-xs text-gray-400 text-right pr-4 border-r border-gray-100">
                    {String(hour).padStart(2, "0")}:00
                  </div>
                  {visibleDays.map((day) => (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "relative border-l border-gray-100 transition-colors",
                        editable && "hover:bg-primary-50/30 cursor-pointer group",
                        isToday(day) && "bg-primary-50/20"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (editable && onCellClick) onCellClick(day, hour);
                      }}
                    >
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
              {visibleDays.map((day, dayIndex) => {
                const dayEvents = getEventsForDay(day);
                return dayEvents.map((event) => {
                  const { top, height } = getEventPosition(event);
                  const colCount = viewMode === "day" ? 2 : 8;
                  const leftOffset = (dayIndex + 1) * (100 / colCount);
                  const isHovered = hoveredEventId === event.id;

                  return (
                    <div
                      key={event.id}
                      className="absolute"
                      style={{
                        top: top + 2,
                        height: height - 4,
                        left: `calc(${leftOffset}% + 4px)`,
                        width: `calc(${100 / colCount}% - 10px)`,
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

                      {/* Tooltip on hover */}
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
      </div>

      {/* Bottom Stats Bar */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            icon={<Clock className="h-5 w-5 text-primary-500" />}
            label="THỜI GIAN HỌC TUẦN NÀY"
            value={`${stats.studyHours ?? 0} Giờ`}
          />
          <StatCard
            icon={<CheckCircle className="h-5 w-5 text-green-500" />}
            label="NHIỆM VỤ HOÀN THÀNH"
            value={`${stats.tasksCompleted ?? 0} / ${stats.tasksTotal ?? 0}`}
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
            label="HIỆU SUẤT TẬP TRUNG"
            value={`${stats.focusPercent ?? 0}%`}
          />
        </div>
      )}

      {/* FAB - create button for editable mode */}
      {editable && (
        <button
          onClick={() => onCellClick?.(new Date(), new Date().getHours())}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 hover:shadow-xl transition-all flex items-center justify-center"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}

/** Event card matching the design - colored left border, tag, time, title */
function DefaultEventCard({ event }: { event: ScheduleEvent }) {
  const colors = getEventColor(event);
  return (
    <div
      className={cn(
        "h-full rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-md overflow-hidden",
        colors.border,
        colors.bg
      )}
    >
      <div className="h-full p-2.5 flex flex-col justify-between">
        <div>
          {/* Time range */}
          <p className={cn("text-[11px] font-semibold", colors.text)}>
            {format(parseISO(event.startTime), "HH:mm")} - {format(parseISO(event.endTime), "HH:mm")}
          </p>
          {/* Title */}
          <h4 className="font-semibold text-gray-900 text-xs mt-1 line-clamp-2">
            {event.title}
          </h4>
        </div>

        {/* Bottom: tag or participants */}
        {(event.tag || event.participants) && (
          <div className="flex items-center justify-between mt-1">
            {event.tag && (
              <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", colors.tagBg)}>
                {event.tag}
              </span>
            )}
            {event.participants && (
              <span className="text-[10px] text-gray-500">+{event.participants}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Stat card for bottom bar */
function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl border px-5 py-4 shadow-sm">
      <div className="p-2 bg-gray-50 rounded-xl">{icon}</div>
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
