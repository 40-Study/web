"use client";

import { useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import WeekCalendarGrid from "@/components/schedule/week-calendar-grid";
import ScheduleEventTooltip from "@/components/schedule/schedule-event-tooltip";
import ScheduleEventDetailDialog from "@/components/schedule/schedule-event-detail-dialog";
import type { ScheduleEvent } from "@/components/schedule/week-calendar-grid";
import { useMySchedules } from "@/hooks/queries/use-class-schedule";
import type { ClassSchedule } from "@/types/class-schedule";

/** Convert recurring class schedules to calendar events for current week */
function toScheduleEvents(schedules: ClassSchedule[]): ScheduleEvent[] {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday

  return schedules.flatMap((s) => {
    // Generate event for this week based on day_of_week
    const eventDate = new Date(startOfWeek);
    eventDate.setDate(startOfWeek.getDate() + ((s.day_of_week + 6) % 7)); // Adjust: 0=Sun -> 6, 1=Mon -> 0

    const [startH, startM] = s.start_time.split(":").map(Number);
    const [endH, endM] = s.end_time.split(":").map(Number);

    const startTime = new Date(eventDate);
    startTime.setHours(startH, startM, 0, 0);
    const endTime = new Date(eventDate);
    endTime.setHours(endH, endM, 0, 0);

    const now = new Date();
    const status: ScheduleEvent["status"] =
      endTime < now ? "completed" : startTime <= now && endTime >= now ? "ongoing" : "upcoming";

    return {
      id: s.id,
      title: s.title || "Buổi học",
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      type: "livestream" as const,
      status,
      teacher: s.teacher_name,
      location: s.room,
    };
  });
}

export default function StudentSchedulePage() {
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const { data: schedules, isLoading } = useMySchedules();

  const events = useMemo(() => toScheduleEvents(schedules || []), [schedules]);

  // Calculate stats from events
  const stats = useMemo(() => {
    const completed = events.filter((e) => e.status === "completed");
    const total = events.length;
    const studyHours = events.reduce((acc, e) => {
      const start = new Date(e.startTime);
      const end = new Date(e.endTime);
      return acc + (end.getTime() - start.getTime()) / 3600000;
    }, 0);
    return {
      studyHours: Math.round(studyHours * 10) / 10,
      tasksCompleted: completed.length,
      tasksTotal: total,
      focusPercent: total > 0 ? Math.round((completed.length / total) * 100) : 0,
    };
  }, [events]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <WeekCalendarGrid
        events={events}
        renderEventTooltip={(event) => (
          <ScheduleEventTooltip event={event} onViewDetail={setSelectedEvent} />
        )}
        stats={stats}
      />

      <ScheduleEventDetailDialog
        event={selectedEvent}
        open={!!selectedEvent}
        onOpenChange={(open) => {
          if (!open) setSelectedEvent(null);
        }}
      />
    </div>
  );
}
