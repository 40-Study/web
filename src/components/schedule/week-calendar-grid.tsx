"use client";

/**
 * WeekCalendarGrid — FullCalendar-based calendar with drag-drop, resize,
 * and Google Calendar-style drag-to-select with QuickCreatePopover.
 */

import { useRef, useMemo, useState, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, {
  type DateClickArg,
  type EventResizeDoneArg,
} from "@fullcalendar/interaction";
import type {
  EventClickArg,
  EventDropArg,
  EventContentArg,
  DateSelectArg,
} from "@fullcalendar/core";
import { Clock, CheckCircle, TrendingUp } from "lucide-react";
import CalendarEventCard, { getEventColor } from "./calendar-event-card";
import ScheduleQuickCreatePopover, {
  type QuickCreateData,
} from "./schedule-quick-create-popover";

// ─── Public types ────────────────────────────────────────────────────────────

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
  tag?: string;
  participants?: number;
  avatarUrl?: string;
  recurrenceRule?: string;
}

export interface SelectionInfo {
  start: Date;
  end: Date;
  /** Screen position for popover anchor */
  x: number;
  y: number;
}

interface WeekCalendarGridProps {
  events: ScheduleEvent[];
  editable?: boolean;
  snapDuration?: string;
  onCellClick?: (day: Date, hour: number) => void;
  onEventClick?: (event: ScheduleEvent) => void;
  onEventChange?: (eventId: string, newStart: string, newEnd: string) => void;
  /** Called when user quick-saves from the drag popover */
  onQuickCreate?: (data: QuickCreateData) => void;
  /** Called when user clicks "More options" in the drag popover */
  onSelectMore?: (start: Date, end: Date) => void;
  renderEventTooltip?: (event: ScheduleEvent) => React.ReactNode;
  headerActions?: React.ReactNode;
  stats?: {
    studyHours?: number;
    tasksCompleted?: number;
    tasksTotal?: number;
    focusPercent?: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getEventPosition(
  event: ScheduleEvent,
  startHourOffset = 7
): { top: number; height: number } {
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  const SLOT_HEIGHT = 64;
  const startHour = start.getHours() + start.getMinutes() / 60;
  const duration = (end.getTime() - start.getTime()) / 3_600_000;
  return {
    top: (startHour - startHourOffset) * SLOT_HEIGHT,
    height: duration * SLOT_HEIGHT,
  };
}

function toFcEvents(events: ScheduleEvent[]) {
  return events.map((ev) => {
    const colors = getEventColor(ev);
    return {
      id: ev.id,
      title: ev.title,
      start: ev.startTime,
      end: ev.endTime,
      rrule: ev.recurrenceRule || undefined,
      backgroundColor: "transparent",
      borderColor: "transparent",
      extendedProps: { scheduleEvent: ev, fcColor: colors.fc },
    };
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function WeekCalendarGrid({
  events,
  editable = false,
  snapDuration = "00:15:00",
  onCellClick,
  onEventClick,
  onEventChange,
  onQuickCreate,
  onSelectMore,
  renderEventTooltip,
  headerActions,
  stats,
}: WeekCalendarGridProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const [selection, setSelection] = useState<SelectionInfo | null>(null);

  const fcEvents = useMemo(() => toFcEvents(events), [events]);

  // ── Event rendering ──────────────────────────────────────────────────────

  const renderEventContent = (arg: EventContentArg) => {
    const ev: ScheduleEvent = arg.event.extendedProps.scheduleEvent;
    const isHovered = hoveredEventId === ev.id;

    if (renderEventTooltip) {
      return (
        <TooltipWrapper
          ev={ev}
          isHovered={isHovered}
          onMouseEnter={() => setHoveredEventId(ev.id)}
          onMouseLeave={() => setHoveredEventId(null)}
          tooltip={renderEventTooltip(ev)}
        />
      );
    }

    return (
      <div className="w-full h-full p-0 overflow-hidden">
        <CalendarEventCard event={ev} />
      </div>
    );
  };

  // ── FullCalendar handlers ─────────────────────────────────────────────────

  const handleDateClick = (arg: DateClickArg) => {
    if (!editable || !onCellClick) return;
    onCellClick(arg.date, arg.date.getHours());
  };

  const handleEventClick = (arg: EventClickArg) => {
    const ev: ScheduleEvent = arg.event.extendedProps.scheduleEvent;
    onEventClick?.(ev);
  };

  const handleEventDrop = (arg: EventDropArg) => {
    if (!arg.event.start || !arg.event.end) { arg.revert(); return; }
    onEventChange?.(arg.event.id, arg.event.start.toISOString(), arg.event.end.toISOString());
  };

  const handleEventResize = (arg: EventResizeDoneArg) => {
    if (!arg.event.start || !arg.event.end) { arg.revert(); return; }
    onEventChange?.(arg.event.id, arg.event.start.toISOString(), arg.event.end.toISOString());
  };

  /**
   * FullCalendar select callback — fires when user finishes drag-selecting.
   * jsEvent carries mouse coordinates for popover positioning.
   */
  const handleSelect = useCallback((arg: DateSelectArg) => {
    const jsEvent = arg.jsEvent as MouseEvent | null;
    const x = jsEvent?.clientX ?? window.innerWidth / 2;
    const y = jsEvent?.clientY ?? window.innerHeight / 2;
    setSelection({ start: arg.start, end: arg.end, x, y });
  }, []);

  const handleUnselect = useCallback(() => {
    // Called by FullCalendar when selection is cleared externally
    setSelection(null);
  }, []);

  // ── Quick create popover callbacks ────────────────────────────────────────

  const handleQuickSave = useCallback(
    (data: QuickCreateData) => {
      onQuickCreate?.(data);
      setSelection(null);
      // Clear FullCalendar's visual selection highlight
      calendarRef.current?.getApi().unselect();
    },
    [onQuickCreate]
  );

  const handleMoreOptions = useCallback(
    (data: QuickCreateData) => {
      onSelectMore?.(data.startTime, data.endTime);
      setSelection(null);
      calendarRef.current?.getApi().unselect();
    },
    [onSelectMore]
  );

  const handleClosePopover = useCallback(() => {
    setSelection(null);
    calendarRef.current?.getApi().unselect();
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {headerActions && (
        <div className="flex items-center justify-end">{headerActions}</div>
      )}

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden fc-custom-wrap">
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          locale="vi"
          firstDay={1}
          slotMinTime="07:00:00"
          slotMaxTime="23:00:00"
          slotDuration="01:00:00"
          snapDuration={snapDuration}
          height="auto"
          events={fcEvents}
          editable={editable}
          droppable={editable}
          selectable={editable}
          selectMirror={true}
          unselectAuto={false}
          eventContent={renderEventContent}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          select={handleSelect}
          unselect={handleUnselect}
          nowIndicator
          allDaySlot={false}
          eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          buttonText={{
            today: "Hôm nay",
            month: "Tháng",
            week: "Tuần",
            day: "Ngày",
          }}
        />
      </div>

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

      {/* Quick create popover rendered as portal */}
      {selection && (
        <ScheduleQuickCreatePopover
          anchorX={selection.x}
          anchorY={selection.y}
          startTime={selection.start}
          endTime={selection.end}
          onSave={handleQuickSave}
          onMoreOptions={handleMoreOptions}
          onClose={handleClosePopover}
        />
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

/**
 * Tooltip wrapper — renders a custom tooltip popover on hover using a
 * simple CSS-positioned approach (no Radix, no external deps).
 */
function TooltipWrapper({
  ev,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  tooltip,
}: {
  ev: ScheduleEvent;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  tooltip: React.ReactNode;
}) {
  return (
    <div
      className="relative w-full h-full p-0 overflow-visible"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="w-full h-full overflow-hidden">
        <CalendarEventCard event={ev} />
      </div>
      {isHovered && (
        <div
          className="absolute left-full top-0 ml-2 z-50 min-w-[220px]"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          {tooltip}
        </div>
      )}
    </div>
  );
}
