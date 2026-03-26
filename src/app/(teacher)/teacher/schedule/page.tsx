"use client";

import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import WeekCalendarGrid from "@/components/schedule/week-calendar-grid";
import ScheduleEventTooltip from "@/components/schedule/schedule-event-tooltip";
import ScheduleEventFormDialog from "@/components/schedule/schedule-event-form-dialog";
import type { ScheduleEvent } from "@/components/schedule/week-calendar-grid";
import type { EventFormData } from "@/components/schedule/schedule-event-form-dialog";

// Mock data - replace with API
const INITIAL_EVENTS: ScheduleEvent[] = [
  {
    id: "1",
    title: "Lập trình Python",
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
    title: "Seminar Công nghệ",
    courseId: "c2",
    startTime: "2026-03-23T14:00:00",
    endTime: "2026-03-23T15:30:00",
    type: "livestream",
    status: "ongoing",
    meetingUrl: "https://meet.google.com/abc",
    teacher: "Bạn",
    location: "Online - Google Meet",
  },
  {
    id: "3",
    title: "React Advanced Patterns",
    courseId: "c3",
    startTime: "2026-03-24T10:00:00",
    endTime: "2026-03-24T11:30:00",
    type: "video",
    status: "upcoming",
    teacher: "Bạn",
    location: "Phòng B202",
  },
];

export default function TeacherSchedulePage() {
  const [events, setEvents] = useState<ScheduleEvent[]>(INITIAL_EVENTS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [defaultDate, setDefaultDate] = useState<Date | undefined>();
  const [defaultHour, setDefaultHour] = useState<number | undefined>();

  const handleCellClick = useCallback((day: Date, hour: number) => {
    setEditingEvent(null);
    setDefaultDate(day);
    setDefaultHour(hour);
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
      // Update existing event
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? { ...e, ...data, status: e.status }
            : e
        )
      );
    } else {
      // Create new event
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
        teacher: "Bạn",
      };
      setEvents((prev) => [...prev, newEvent]);
    }
    // TODO: call API - classService.createSchedule / updateSchedule
  }, []);

  const handleDelete = useCallback((eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    // TODO: call API - classService.deleteSchedule
  }, []);

  return (
    <>
      <WeekCalendarGrid
        events={events}
        title="Lịch giảng dạy"
        subtitle="Quản lý lịch dạy và tạo buổi học mới"
        editable
        onCellClick={handleCellClick}
        onEventClick={handleEventClick}
        renderEventTooltip={(event) => (
          <ScheduleEventTooltip
            event={event}
            editable
            onEdit={handleEventClick}
          />
        )}
        headerActions={
          <Button
            onClick={() => {
              setEditingEvent(null);
              setDefaultDate(new Date());
              setDefaultHour(8);
              setDialogOpen(true);
            }}
            size="sm"
            className="gap-1"
          >
            <Plus className="w-4 h-4" />
            Tạo buổi học
          </Button>
        }
      />

      <ScheduleEventFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={editingEvent}
        defaultDate={defaultDate}
        defaultHour={defaultHour}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </>
  );
}
