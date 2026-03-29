"use client";

/**
 * WeekCalendarGrid — FullCalendar-based calendar with drag-drop and resize.
 * Wraps @fullcalendar/react with timegrid + interaction plugins.
 * Keeps the same external API as the previous custom grid so page.tsx needs
 * minimal changes.
 */

import { useRef, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import * as Popover from "@radix-ui/react-popover";
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
} from "@fullcalendar/core";
import { Clock, CheckCircle, TrendingUp } from "lucide-react";
import CalendarEventCard, { getEventColor } from "./calendar-event-card";

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

interface WeekCalendarGridProps {
  events: ScheduleEvent[];
  editable?: boolean;
  /** Slot duration for grid snapping, e.g. "00:15:00" for 15min (default: 15min) */
  slotDuration?: string;
  onCellClick?: (day: Date, hour: number) => void;
  onEventClick?: (event: ScheduleEvent) => void;
  onEventChange?: (eventId: string, newStart: string, newEnd: string) => void;
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

/** Keep legacy helper exported so other files that import it don't break */
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

/** Map ScheduleEvent array → FullCalendar EventInput array */
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
      // Carry original data in extendedProps for rendering
      extendedProps: { scheduleEvent: ev, fcColor: colors.fc },
    };
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function WeekCalendarGrid({
  events,
  editable = false,
  slotDuration = "00:15:00",
  onCellClick,
  onEventClick,
  onEventChange,
  renderEventTooltip,
  headerActions,
  stats,
}: WeekCalendarGridProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);

  const fcEvents = useMemo(() => toFcEvents(events), [events]);

  // FullCalendar renders custom event content with hover tooltip
  const renderEventContent = (arg: EventContentArg) => {
    const ev: ScheduleEvent = arg.event.extendedProps.scheduleEvent;
    const isHovered = hoveredEventId === ev.id;

    if (renderEventTooltip) {
      return (
        <Popover.Root open={isHovered}>
          <Popover.Anchor asChild>
            <div
              className="w-full h-full p-0 overflow-hidden"
              onMouseEnter={() => setHoveredEventId(ev.id)}
              onMouseLeave={() => setHoveredEventId(null)}
            >
              <CalendarEventCard event={ev} />
            </div>
          </Popover.Anchor>
          <Popover.Portal>
            <Popover.Content
              side="right"
              align="start"
              sideOffset={8}
              className="z-50"
              onMouseEnter={() => setHoveredEventId(ev.id)}
              onMouseLeave={() => setHoveredEventId(null)}
            >
              {renderEventTooltip(ev)}
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      );
    }

    return (
      <div className="w-full h-full p-0 overflow-hidden">
        <CalendarEventCard event={ev} />
      </div>
    );
  };

  const handleDateClick = (arg: DateClickArg) => {
    if (!editable || !onCellClick) return;
    onCellClick(arg.date, arg.date.getHours());
  };

  const handleEventClick = (arg: EventClickArg) => {
    const ev: ScheduleEvent = arg.event.extendedProps.scheduleEvent;
    onEventClick?.(ev);
  };

  const handleEventDrop = (arg: EventDropArg) => {
    if (!arg.event.start || !arg.event.end) {
      arg.revert();
      return;
    }
    onEventChange?.(
      arg.event.id,
      arg.event.start.toISOString(),
      arg.event.end.toISOString()
    );
  };

  const handleEventResize = (arg: EventResizeDoneArg) => {
    if (!arg.event.start || !arg.event.end) {
      arg.revert();
      return;
    }
    onEventChange?.(
      arg.event.id,
      arg.event.start.toISOString(),
      arg.event.end.toISOString()
    );
  };

  return (
    <div className="space-y-4">
      {/* Custom header actions row */}
      {headerActions && (
        <div className="flex items-center justify-end">{headerActions}</div>
      )}

      {/* FullCalendar */}
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
          slotDuration={slotDuration}
          snapDuration={slotDuration}
          height="auto"
          events={fcEvents}
          editable={editable}
          droppable={editable}
          selectable={editable}
          eventContent={renderEventContent}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
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
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl border px-5 py-4 shadow-sm">
      <div className="p-2 bg-gray-50 rounded-xl">{icon}</div>
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
