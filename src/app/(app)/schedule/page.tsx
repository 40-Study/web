"use client";

import WeekCalendarGrid from "@/components/schedule/week-calendar-grid";
import ScheduleEventTooltip from "@/components/schedule/schedule-event-tooltip";
import type { ScheduleEvent } from "@/components/schedule/week-calendar-grid";

// Mock data - replace with API
const MOCK_STUDENT_EVENTS: ScheduleEvent[] = [
  {
    id: "1",
    title: "Toán Cao cấp A1",
    courseId: "c1",
    startTime: "2026-03-23T08:00:00",
    endTime: "2026-03-23T09:30:00",
    type: "video",
    status: "completed",
    teacher: "TS. Nguyễn Văn A",
    location: "Phòng A101",
    description: "Học về giới hạn và đạo hàm",
  },
  {
    id: "2",
    title: "Tiếng Anh Giao tiếp",
    courseId: "c2",
    startTime: "2026-03-23T10:00:00",
    endTime: "2026-03-23T11:30:00",
    type: "livestream",
    status: "ongoing",
    meetingUrl: "https://meet.google.com/abc",
    teacher: "Cô Trần Thị B",
    location: "Online - Google Meet",
    description: "Conversation skills - Daily topics",
  },
  {
    id: "3",
    title: "Lập trình Python cơ bản",
    courseId: "c3",
    startTime: "2026-03-24T14:00:00",
    endTime: "2026-03-24T15:30:00",
    type: "video",
    status: "upcoming",
    teacher: "Th.S Hoàng Văn C",
    location: "Phòng B202",
    description: "Python fundamentals - Functions & Modules",
  },
  {
    id: "4",
    title: "Kỹ năng mềm",
    courseId: "c4",
    startTime: "2026-03-25T09:00:00",
    endTime: "2026-03-25T10:30:00",
    type: "hybrid",
    status: "upcoming",
    teacher: "TS. Lê Thị D",
    location: "Phòng C303 - Online",
    description: "Teamwork & Communication skills",
  },
  {
    id: "5",
    title: "Toán rời rạc",
    courseId: "c5",
    startTime: "2026-03-26T08:00:00",
    endTime: "2026-03-26T09:30:00",
    type: "video",
    status: "upcoming",
    teacher: "PGS.TS. Phạm Văn E",
    location: "Phòng D404",
    description: "Logic và chứng minh toán học",
  },
];

export default function StudentSchedulePage() {
  const events = MOCK_STUDENT_EVENTS;

  return (
    <div className="p-6">
      <WeekCalendarGrid
        events={events}
        title="Lịch học"
        subtitle="Xem lịch học và tham gia lớp học"
        renderEventTooltip={(event) => <ScheduleEventTooltip event={event} />}
      />
    </div>
  );
}
