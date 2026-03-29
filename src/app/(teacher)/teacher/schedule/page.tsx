"use client";

import { useState, useCallback } from "react";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import WeekCalendarGrid from "@/components/schedule/week-calendar-grid";
import ScheduleEventTooltip from "@/components/schedule/schedule-event-tooltip";
import ScheduleEventFormDialog from "@/components/schedule/schedule-event-form-dialog";
import type { ScheduleEvent } from "@/components/schedule/week-calendar-grid";
import type { EventFormData } from "@/components/schedule/schedule-event-form-dialog";
import type { QuickCreateData } from "@/components/schedule/schedule-quick-create-popover";

const INITIAL_EVENTS: ScheduleEvent[] = [
  {
    id: "1",
    title: "Lập trình Python - Buổi 5",
    courseId: "c1",
    startTime: "2026-03-23T09:00:00",
    endTime: "2026-03-23T10:30:00",
    type: "video",
    status: "completed",
    teacher: "Bạn",
    location: "Phòng A101",
  },
  {
    id: "2",
    title: "Seminar Công nghệ AI",
    courseId: "c2",
    startTime: "2026-03-24T14:00:00",
    endTime: "2026-03-24T16:00:00",
    type: "livestream",
    status: "upcoming",
    meetingUrl: "https://meet.google.com/abc",
    teacher: "Bạn",
    location: "Online - Google Meet",
    tag: "LIVESTREAM",
    participants: 45,
  },
  {
    id: "3",
    title: "React Advanced Patterns",
    courseId: "c3",
    startTime: "2026-03-25T10:00:00",
    endTime: "2026-03-25T11:30:00",
    type: "video",
    status: "upcoming",
    teacher: "Bạn",
    location: "Phòng B202",
  },
  {
    id: "4",
    title: "Chấm bài tập lớn nhóm 3",
    courseId: "c4",
    startTime: "2026-03-26T19:00:00",
    endTime: "2026-03-26T21:00:00",
    type: "hybrid",
    status: "upcoming",
    teacher: "Bạn",
    tag: "GIAO VIỆC",
    participants: 8,
  },
];

export default function TeacherSchedulePage() {
  const [events, setEvents] = useState<ScheduleEvent[]>(INITIAL_EVENTS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [defaultDate, setDefaultDate] = useState<Date | undefined>();
  const [defaultHour, setDefaultHour] = useState<number | undefined>();
  const [defaultEndTime, setDefaultEndTime] = useState<string | undefined>();

  const handleCellClick = useCallback((day: Date, hour: number) => {
    setEditingEvent(null);
    setDefaultDate(day);
    setDefaultHour(hour);
    setDefaultEndTime(undefined);
    setDialogOpen(true);
  }, []);

  const handleEventClick = useCallback((event: ScheduleEvent) => {
    setEditingEvent(event);
    setDefaultDate(undefined);
    setDefaultHour(undefined);
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback((data: EventFormData, eventId?: string) => {
    if (eventId) {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? {
                ...e,
                ...data,
                status: e.status,
                recurrenceRule: data.recurrenceRule || undefined,
              }
            : e
        )
      );
    } else {
      const newEvent: ScheduleEvent = {
        id: crypto.randomUUID(),
        title: data.title,
        type: data.type,
        startTime: data.startTime,
        endTime: data.endTime,
        status: "upcoming",
        location: data.location || undefined,
        meetingUrl: data.meetingUrl || undefined,
        description: data.description || undefined,
        recurrenceRule: data.recurrenceRule || undefined,
        teacher: "Bạn",
      };
      setEvents((prev) => [...prev, newEvent]);
    }
  }, []);

  const handleDelete = useCallback((eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  }, []);

  /** Called by FullCalendar after drag-drop or resize */
  const handleEventChange = useCallback(
    (eventId: string, newStart: string, newEnd: string) => {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId ? { ...e, startTime: newStart, endTime: newEnd } : e
        )
      );
    },
    []
  );

  /** Called from QuickCreatePopover "Lưu" — creates a minimal event immediately */
  const handleQuickCreate = useCallback((data: QuickCreateData) => {
    const newEvent: ScheduleEvent = {
      id: crypto.randomUUID(),
      title: data.title,
      type: "video",
      startTime: data.startTime.toISOString(),
      endTime: data.endTime.toISOString(),
      status: "upcoming",
      teacher: "Bạn",
    };
    setEvents((prev) => [...prev, newEvent]);
  }, []);

  /**
   * Called from QuickCreatePopover "Thêm tùy chọn" — pre-fills and opens
   * the full form dialog with the drag-selected time range.
   */
  const handleSelectMore = useCallback((start: Date, end: Date) => {
    setEditingEvent(null);
    setDefaultDate(start);
    setDefaultHour(start.getHours());
    // Pass end time via a temporary approach: store as ISO so form can use it
    // We encode end into defaultHour using a custom defaultEndTime state
    setDefaultEndTime(format(end, "HH:mm"));
    setDialogOpen(true);
  }, []);

  return (
    <div className="p-6">
      <WeekCalendarGrid
        events={events}
        editable
        onCellClick={handleCellClick}
        onEventClick={handleEventClick}
        onEventChange={handleEventChange}
        onQuickCreate={handleQuickCreate}
        onSelectMore={handleSelectMore}
        renderEventTooltip={(event) => (
          <ScheduleEventTooltip event={event} editable onEdit={handleEventClick} />
        )}
        headerActions={
          <Button
            onClick={() => {
              setEditingEvent(null);
              setDefaultDate(new Date());
              setDefaultHour(8);
              setDefaultEndTime(undefined);
              setDialogOpen(true);
            }}
            size="sm"
            className="gap-1 rounded-full"
          >
            <Plus className="w-4 h-4" />
            Tạo buổi học
          </Button>
        }
        stats={{
          studyHours: 18,
          tasksCompleted: 6,
          tasksTotal: 8,
          focusPercent: 92,
        }}
      />

      <ScheduleEventFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={editingEvent}
        defaultDate={defaultDate}
        defaultHour={defaultHour}
        defaultEndTime={defaultEndTime}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
