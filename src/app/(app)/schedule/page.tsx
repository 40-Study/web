"use client";

import { useState } from "react";
import WeekCalendarGrid from "@/components/schedule/week-calendar-grid";
import ScheduleEventTooltip from "@/components/schedule/schedule-event-tooltip";
import ScheduleEventDetailDialog from "@/components/schedule/schedule-event-detail-dialog";
import type { ScheduleEvent } from "@/components/schedule/week-calendar-grid";

const MOCK_STUDENT_EVENTS: ScheduleEvent[] = [
  {
    id: "1",
    title: "Tự học: React Native & Expo",
    courseId: "c1",
    startTime: "2026-03-23T09:00:00",
    endTime: "2026-03-23T11:00:00",
    type: "video",
    status: "upcoming",
    teacher: "Tự học",
    description: "Ôn tập React Native cơ bản",
  },
  {
    id: "2",
    title: "Bài tập lớn: Phát triển Web",
    courseId: "c2",
    startTime: "2026-03-25T19:00:00",
    endTime: "2026-03-25T21:00:00",
    type: "hybrid",
    status: "upcoming",
    tag: "GIAO VIỆC",
    teacher: "Trợ giảng Linh",
    participants: 12,
    description: "Hoàn thành Bài tập lớn: Phát triển Ứng dụng Web",
  },
  {
    id: "3",
    title: "Code dự án: Game Mobile Candy Crush",
    courseId: "c3",
    startTime: "2026-03-28T14:00:00",
    endTime: "2026-03-28T17:00:00",
    type: "video",
    status: "upcoming",
    teacher: "Nhóm 5",
    description: "Làm việc nhóm dự án game mobile",
  },
  {
    id: "4",
    title: "Toán Cao cấp A1",
    courseId: "c4",
    startTime: "2026-03-24T08:00:00",
    endTime: "2026-03-24T09:30:00",
    type: "video",
    status: "completed",
    teacher: "TS. Nguyễn Văn A",
    location: "Phòng A101",
  },
  {
    id: "5",
    title: "Tiếng Anh Giao tiếp",
    courseId: "c5",
    startTime: "2026-03-26T10:00:00",
    endTime: "2026-03-26T11:30:00",
    type: "livestream",
    status: "upcoming",
    meetingUrl: "https://meet.google.com/abc",
    teacher: "Cô Trần Thị B",
    location: "Online - Google Meet",
  },
];

export default function StudentSchedulePage() {
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);

  return (
    <div className="p-6">
      <WeekCalendarGrid
        events={MOCK_STUDENT_EVENTS}
        renderEventTooltip={(event) => (
          <ScheduleEventTooltip event={event} onViewDetail={setSelectedEvent} />
        )}
        stats={{
          studyHours: 32.5,
          tasksCompleted: 12,
          tasksTotal: 15,
          focusPercent: 88,
        }}
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
