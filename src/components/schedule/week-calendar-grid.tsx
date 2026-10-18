"use client";

/**
 * WeekCalendarGrid — FullCalendar-based calendar with drag-drop, resize,
 * and Google Calendar-style drag-to-select with QuickCreatePopover.
 */

import { useRef, useMemo, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
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
import { Bell, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { addDays, addMonths, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { vi } from "date-fns/locale";
import { toVnWallClock } from "@/lib/teacher-schedule-events";
import "./calendar.css";
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
  /**
   * Nguồn của mục (B-08). Mặc định (vắng) là buổi livestream sửa được; "class-schedule" (lịch lặp tuần
   * của lớp) và "class-session" (buổi học cụ thể của lớp) chỉ để xem — chỉnh ở trang Quản lý lớp.
   */
  kind?: "livestream" | "class-schedule" | "class-session";
  /**
   * Lịch lặp tuần (B-08) dùng recurring event có sẵn của FullCalendar (daysOfWeek/startTime/endTime), không
   * cần plugin rrule: `daysOfWeek` 0 = Chủ nhật; `startTime`/`endTime` dạng "HH:mm"; `startRecur`/
   * `endRecur` là ngày YYYY-MM-DD (endRecur loại trừ, nên truyền ngày sau ngày hết hạn).
   */
  weekly?: {
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
    startRecur?: string;
    endRecur?: string;
  };
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
  selectable?: boolean;
  snapDuration?: string;
  onCellClick?: (day: Date, hour: number) => void;
  onEventClick?: (event: ScheduleEvent) => void;
  onEventChange?: (eventId: string, newStart: string, newEnd: string) => Promise<void> | void;
  /** Called when user quick-saves from the drag popover */
  onQuickCreate?: (data: QuickCreateData) => void;
  /** Called when user clicks "More options" in the drag popover */
  onSelectMore?: (start: Date, end: Date) => void;
  renderEventTooltip?: (event: ScheduleEvent) => React.ReactNode;
  /** Gọi mỗi khi khoảng ngày đang xem đổi (chuyển tuần/tháng/ngày); `end` loại trừ. */
  onRangeChange?: (start: Date, end: Date) => void;
  headerActions?: React.ReactNode;
  /**
   * Thẻ thống kê dưới lịch. Trang gọi tự đặt nhãn theo vai trò (QA vòng 2, D8): trước đây lưới
   * cứng nhãn góc học sinh ("THỜI GIAN HỌC", "NHIỆM VỤ", "HIỆU SUẤT") ngay cả ở lịch giảng dạy.
   */
  stats?: ScheduleStat[];
}

export interface ScheduleStat {
  key: string;
  label: string;
  value: string;
  icon?: React.ReactNode;
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

export function toFcEvents(events: ScheduleEvent[]) {
  return events.map((ev) => {
    const colors = getEventColor(ev);
    const common = {
      id: ev.id,
      title: ev.title,
      backgroundColor: "transparent",
      borderColor: "transparent",
      extendedProps: { scheduleEvent: ev, fcColor: colors.fc },
    };
    // Lịch lặp tuần: FullCalendar tự lặp theo thứ trong tuần cho mọi tuần đang xem. Không truyền start/end
    // cùng lúc với daysOfWeek (sẽ thành sự kiện một lần).
    if (ev.weekly) {
      return {
        ...common,
        daysOfWeek: ev.weekly.daysOfWeek,
        startTime: ev.weekly.startTime,
        endTime: ev.weekly.endTime,
        startRecur: ev.weekly.startRecur,
        endRecur: ev.weekly.endRecur,
      };
    }
    return {
      ...common,
      start: ev.startTime,
      end: ev.endTime,
      rrule: ev.recurrenceRule || undefined,
    };
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function WeekCalendarGrid({
  events,
  editable = false,
  selectable = editable,
  snapDuration = "00:15:00",
  onCellClick,
  onEventClick,
  onEventChange,
  onQuickCreate,
  onSelectMore,
  renderEventTooltip,
  onRangeChange,
  headerActions,
  stats,
}: WeekCalendarGridProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const [selection, setSelection] = useState<SelectionInfo | null>(null);

  const [title, setTitle] = useState("");
  const [view, setView] = useState("timeGridWeek");
  const [focusDate, setFocusDate] = useState(() => toVnWallClock(new Date()));
  const [month, setMonth] = useState(() => startOfMonth(toVnWallClock(new Date())));
  const [hiddenKinds, setHiddenKinds] = useState<string[]>([]);
  const changingRef = useRef(false);
  const fcEvents = useMemo(() => toFcEvents(events.filter(event => !hiddenKinds.includes(event.kind ?? "livestream"))).map(event => ({
    ...event,
    editable: editable && (!event.extendedProps.scheduleEvent.kind || event.extendedProps.scheduleEvent.kind === "livestream") && event.extendedProps.scheduleEvent.status === "upcoming",
  })), [events, hiddenKinds, editable]);
  const navigate = (date: Date) => {
    calendarRef.current?.getApi().gotoDate(date);
    setFocusDate(date);
    setMonth(startOfMonth(date));
  };
  const miniStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });

  // ── Event rendering ──────────────────────────────────────────────────────

  const renderEventContent = (arg: EventContentArg) => {
    const ev: ScheduleEvent | undefined = arg.event.extendedProps.scheduleEvent;

    // Selection mirror (drag preview) — show time range inside
    if (!ev) {
      const start = arg.event.start;
      const end = arg.event.end;
      if (start && end) {
        const fmt = (d: Date) =>
          `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
        return (
          <div className="flex items-center justify-center h-full text-sm font-medium text-blue-700">
            {fmt(start)} – {fmt(end)}
          </div>
        );
      }
      return null;
    }

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
    onEventClick?.({ ...ev, startTime: arg.event.start?.toISOString() ?? ev.startTime, endTime: arg.event.end?.toISOString() ?? ev.endTime });
  };

  const handleEventMove = useCallback(async (arg: EventDropArg | EventResizeDoneArg) => {
    const original = events.find(event => event.id === arg.event.id);
    const rollback = () => {
      arg.revert();
      if (original) calendarRef.current?.getApi().getEventById(original.id)?.setDates(original.startTime, original.endTime);
    };
    if (changingRef.current || !onEventChange || !arg.event.start || !arg.event.end) { rollback(); return; }
    changingRef.current = true;
    try { await onEventChange(arg.event.id, arg.event.start.toISOString(), arg.event.end.toISOString()); }
    catch { rollback(); }
    finally { changingRef.current = false; }
  }, [events, onEventChange]);

  /**
   * FullCalendar select callback — fires when user finishes drag-selecting.
   * jsEvent carries mouse coordinates for popover positioning.
   */
  const handleSelect = useCallback((arg: DateSelectArg) => {
    const jsEvent = arg.jsEvent as MouseEvent | null;
    const x = jsEvent?.clientX ?? window.innerWidth / 2;
    const y = jsEvent?.clientY ?? window.innerHeight / 2;
    if (onSelectMore && !onQuickCreate) {
      onSelectMore(arg.start, arg.end);
      calendarRef.current?.getApi().unselect();
    } else if (onQuickCreate) setSelection({ start: arg.start, end: arg.end, x, y });
  }, [onSelectMore, onQuickCreate]);

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
    <div className="school-calendar">
      <div className="calendar-toolbar">
        <div className="calendar-heading"><CalendarDays className="h-5 w-5 text-blue-600" /><h1>Lịch học</h1></div>
        <button className="calendar-today" onClick={() => navigate(toVnWallClock(new Date()))}>Hôm nay</button>
        <div className="flex items-center">
          <button className="calendar-icon" aria-label="Khoảng trước" onClick={() => calendarRef.current?.getApi().prev()}><ChevronLeft className="h-4 w-4" /></button>
          <button className="calendar-icon" aria-label="Khoảng tiếp theo" onClick={() => calendarRef.current?.getApi().next()}><ChevronRight className="h-4 w-4" /></button>
        </div>
        <h2 className="calendar-title" aria-live="polite">{title}</h2>
        <select aria-label="Chế độ xem lịch" className="calendar-view" value={view} onChange={event => { setView(event.target.value); calendarRef.current?.getApi().changeView(event.target.value); }}>
          <option value="dayGridMonth">Tháng</option><option value="timeGridWeek">Tuần</option><option value="timeGridDay">Ngày</option>
        </select>
        {headerActions}
      </div>
      <div className="calendar-layout">
        <aside className="calendar-rail" aria-label="Điều hướng lịch">
          <div className="mini-calendar-heading">
            <span>{format(month, "MMMM yyyy", { locale: vi })}</span>
            <button className="calendar-icon" aria-label="Tháng trước" onClick={() => setMonth(addMonths(month, -1))}><ChevronLeft className="h-3.5 w-3.5" /></button>
            <button className="calendar-icon" aria-label="Tháng sau" onClick={() => setMonth(addMonths(month, 1))}><ChevronRight className="h-3.5 w-3.5" /></button>
          </div>
          <div className="mini-calendar-days">
            {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map(day => <span key={day}>{day}</span>)}
            {Array.from({ length: 42 }, (_, index) => {
              const day = addDays(miniStart, index);
              return <button key={day.toISOString()} aria-label={format(day, "dd/MM/yyyy")} aria-pressed={isSameDay(day, focusDate)} data-outside={!isSameMonth(day, month)} data-today={isSameDay(day, toVnWallClock(new Date()))} onClick={() => navigate(day)}>{day.getDate()}</button>;
            })}
          </div>
          <p className="calendar-rail-label">Lịch của tôi</p>
          {([{ key: "livestream", label: "Lớp học trực tuyến", color: "#2563eb" }, { key: "class-schedule", label: "Thời khoá biểu", color: "#0d9488" }, { key: "class-session", label: "Buổi học của lớp", color: "#7c3aed" }] as const).map(item => (
            <label className="calendar-filter" key={item.key}><input type="checkbox" style={{ accentColor: item.color }} checked={!hiddenKinds.includes(item.key)} onChange={() => setHiddenKinds(current => current.includes(item.key) ? current.filter(key => key !== item.key) : [...current, item.key])} />{item.label}</label>
          ))}
          <div className="calendar-reminder-note"><Bell className="h-4 w-4 shrink-0" /><p>Nhắc trước 15 phút và khi đến giờ.<br /><span>Giáo viên · Học sinh · Phụ huynh</span></p></div>
          {selectable && <p className="calendar-rail-help">Bấm hoặc kéo trên lịch để chọn giờ cho buổi học mới.</p>}
        </aside>
        <div className="fc-custom-wrap calendar-surface">
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          initialDate={focusDate}
          headerToolbar={false}
          dayHeaderContent={arg => arg.view.type === "dayGridMonth" ? arg.text : <div className="calendar-day-heading"><span>{format(arg.date, "EEE", { locale: vi })}</span><strong>{arg.date.getDate()}</strong></div>}
          dayMaxEvents={3}
          locale="vi"
          firstDay={1}
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          slotDuration="00:30:00"
          slotLabelInterval="01:00:00"
          scrollTime="07:00:00"
          scrollTimeReset={false}
          snapDuration={snapDuration}
          height="100%"
          events={fcEvents}
          datesSet={(arg) => {
            setTitle(arg.view.title);
            const date = calendarRef.current?.getApi().getDate() ?? arg.start;
            setFocusDate(current => current.getTime() === date.getTime() ? current : date);
            setMonth(current => current.getTime() === startOfMonth(date).getTime() ? current : startOfMonth(date));
            onRangeChange?.(arg.start, arg.end);
          }}
          editable={editable}
          droppable={editable}
          eventAllow={info => info.start.getTime() >= toVnWallClock(new Date()).getTime() - 60_000}
          selectable={selectable}
          selectMirror={true}
          unselectAuto={false}
          selectAllow={(info) => {
            // Only allow selection within the same day (single column)
            return info.start.toDateString() === info.end.toDateString() ||
              // Allow if end is midnight of next day (full day selection edge case)
              (info.end.getHours() === 0 && info.end.getMinutes() === 0 &&
                new Date(info.end.getTime() - 1).toDateString() === info.start.toDateString());
          }}
          eventContent={renderEventContent}
          dateClick={onSelectMore || onQuickCreate ? undefined : handleDateClick}
          eventClick={handleEventClick}
          eventDrop={handleEventMove}
          eventResize={handleEventMove}
          select={handleSelect}
          unselect={handleUnselect}
          nowIndicator
          allDaySlot={false}
          slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          buttonText={{
            today: "Hôm nay",
            month: "Tháng",
            week: "Tuần",
            day: "Ngày",
          }}
        />
        </div>
      </div>

      {stats && stats.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((s) => (
            <StatCard key={s.key} icon={s.icon} label={s.label} value={s.value} />
          ))}
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

function StatCard({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl border px-5 py-4 shadow-sm" data-testid="schedule-stat">
      {icon && <div className="p-2 bg-gray-50 rounded-xl">{icon}</div>}
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

/**
 * Tooltip wrapper — renders tooltip via portal to escape FullCalendar's
 * stacking context and overlay above other events.
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isHovered && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const tooltipWidth = 288; // w-72 = 18rem = 288px
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let left = rect.right + 8;
      let top = rect.top;

      // If overflows right, show on left side
      if (left + tooltipWidth > vw - 16) {
        left = rect.left - tooltipWidth - 8;
      }
      // Keep within viewport vertically
      if (top + 200 > vh) {
        top = vh - 216;
      }
      if (top < 8) top = 8;

      setPos({ top, left: Math.max(8, left) });
    }
  }, [isHovered]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full p-0"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="w-full h-full overflow-hidden">
        <CalendarEventCard event={ev} />
      </div>
      {isHovered &&
        createPortal(
          <div
            style={{ top: pos.top, left: pos.left }}
            className="fixed z-[9999]"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            {tooltip}
          </div>,
          document.body
        )}
    </div>
  );
}
