"use client";

import { useCallback, useMemo, useState } from "react";
import { differenceInMinutes, format } from "date-fns";
import { CalendarCheck, Clock, Plus } from "lucide-react";
import { LiveSessionLaunch } from "@/components/teacher/live-session-launch";
import { Button } from "@/components/ui/button";
import WeekCalendarGrid from "@/components/schedule/week-calendar-grid";
import ScheduleEventDetailDialog from "@/components/schedule/schedule-event-detail-dialog";
import ScheduleEventTooltip from "@/components/schedule/schedule-event-tooltip";
import ScheduleEventFormDialog from "@/components/schedule/schedule-event-form-dialog";
import type { ScheduleEvent, ScheduleStat } from "@/components/schedule/week-calendar-grid";
import type { EventFormData } from "@/components/schedule/schedule-event-form-dialog";
import { useAuthStore } from "@/stores/auth.store";
import {
  useLiveSessions,
  useCreateLiveSession,
  useUpdateLiveSession,
  useDeleteLiveSession,
} from "@/hooks/queries/use-live-sessions";
import { useMyTimetableEntries } from "@/hooks/queries/use-class-schedule";
import {
  liveSessionToEvent,
  timetableEntriesToEvents,
  visibleDateRange,
  vnWallClockToIso,
} from "@/lib/teacher-schedule-events";
import type { UpdateLiveSessionDTO } from "@/services/live-session.service";

/** Shared calendar: persisted class livestreams plus the current teaching timetable. */
export default function TeacherSchedulePage() {
  const { user } = useAuthStore();
  const [detail, setDetail] = useState<ScheduleEvent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [defaultDate, setDefaultDate] = useState<Date | undefined>();
  const [defaultHour, setDefaultHour] = useState<number | undefined>();
  const [defaultEndTime, setDefaultEndTime] = useState<string>();
  const [range, setRange] = useState<{ from: string; to: string } | undefined>();

  const { data: sessionsData, isLoading, isError, refetch } = useLiveSessions(
    user?.id ? { host_id: user.id, page_size: 100 } : undefined
  );
  const { data: timetableEntries, isError: timetableError, refetch: refetchTimetable } = useMyTimetableEntries(range);
  const createLiveSession = useCreateLiveSession();
  const updateLiveSession = useUpdateLiveSession();
  const deleteLiveSession = useDeleteLiveSession();

  const liveEvents: ScheduleEvent[] = useMemo(
    () => (sessionsData?.sessions ?? []).map(liveSessionToEvent),
    [sessionsData]
  );
  const classEvents: ScheduleEvent[] = useMemo(
    () =>
      timetableEntriesToEvents(timetableEntries?.entries ?? [], {
        range,
        cancelled: timetableEntries?.cancelled,
      }),
    [timetableEntries, range]
  );
  const events = useMemo(() => [...liveEvents, ...classEvents], [liveEvents, classEvents]);

  // Số giờ dạy thật trong các buổi cụ thể đã lấy về (livestream + buổi lớp ngoài lịch) — lịch lặp tuần
  // không cộng vì mỗi dòng đại diện cho nhiều tuần. Cộng trên MỌI buổi đã tải (không lọc theo tuần).
  const concreteEvents = useMemo(
    () => events.filter((e) => e.kind !== "class-schedule"),
    [events]
  );
  const studyHours = useMemo(
    () =>
      Math.round(
        concreteEvents.reduce(
          (sum, e) => sum + differenceInMinutes(new Date(e.endTime), new Date(e.startTime)) / 60,
          0
        )
      ),
    [concreteEvents]
  );

  // QA vòng 2 (D8): lịch giảng dạy từng hiện nhãn góc học sinh ("THỜI GIAN HỌC", "NHIỆM VỤ HOÀN
  // THÀNH", "HIỆU SUẤT TẬP TRUNG") với 2 số luôn bằng 0. Chỉ giữ số liệu có nguồn thật.
  const stats: ScheduleStat[] = useMemo(
    () => [
      {
        key: "teaching-hours",
        label: "TỔNG GIỜ DẠY ĐÃ LÊN LỊCH",
        value: `${studyHours} giờ`,
        icon: <Clock className="h-5 w-5 text-primary-500" />,
      },
      {
        key: "sessions",
        label: "SỐ BUỔI HỌC",
        value: `${concreteEvents.length} buổi`,
        icon: <CalendarCheck className="h-5 w-5 text-green-500" />,
      },
    ],
    [studyHours, concreteEvents.length]
  );

  const handleRangeChange = useCallback((start: Date, end: Date) => {
    const next = visibleDateRange(start, end);
    // FullCalendar gọi datesSet cả khi render lại cùng khoảng: giữ nguyên tham chiếu để không gọi lại API.
    setRange((prev) => (prev && prev.from === next.from && prev.to === next.to ? prev : next));
  }, []);

  const handleEventClick = useCallback((event: ScheduleEvent) => {
    // Lịch lặp/buổi học của lớp chỉ để xem — form này sửa buổi livestream.
    if (event.kind && event.kind !== "livestream") { setDetail(event); return; }
    setEditingEvent(event);
    setDefaultDate(undefined);
    setDefaultHour(undefined);
    setDefaultEndTime(undefined);
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(
    async (data: EventFormData, eventId?: string) => {
      const location = data.location.trim();
      if (eventId) {
        const dto: UpdateLiveSessionDTO = {
          title: data.title,
          description: data.description || undefined,
          // Chuỗi rỗng = xoá phòng đã lưu (backend quy ước), nên luôn gửi.
          location,
        };
        // Chỉ gửi lịch khi thực sự đổi: backend chặn giờ bắt đầu trong quá khứ, nên gửi lại nguyên giờ
        // cũ của buổi đã quá giờ (nhưng chưa bắt đầu) sẽ làm hỏng cả việc sửa tiêu đề.
        const original = events.find((e) => e.id === eventId);
        const startChanged = !original || new Date(data.startTime).getTime() !== new Date(original.startTime).getTime();
        const endChanged = !original || new Date(data.endTime).getTime() !== new Date(original.endTime).getTime();
        // Form trả giờ theo trường LOCAL (= giờ VN đang hiển thị): đổi sang RFC3339 +07:00 để máy ngoài múi giờ VN
        // không gửi sai khoảnh khắc.
        if (startChanged) dto.scheduled_at = vnWallClockToIso(new Date(data.startTime));
        if (startChanged || endChanged) dto.scheduled_end_at = vnWallClockToIso(new Date(data.endTime));
        await updateLiveSession.mutateAsync({ id: eventId, dto });
        return;
      }
      if (!data.classId) return;
      await createLiveSession.mutateAsync({
        title: data.title,
        description: data.description || undefined,
        class_id: data.classId,
        course_id: data.courseId || undefined,
        scheduled_at: vnWallClockToIso(new Date(data.startTime)),
        scheduled_end_at: vnWallClockToIso(new Date(data.endTime)),
        location: location || undefined,
      });
    },
    [createLiveSession, updateLiveSession, events]
  );

  const handleDelete = useCallback(
    async (eventId: string) => {
      await deleteLiveSession.mutateAsync(eventId);
    },
    [deleteLiveSession]
  );

  return (
    <div>
      {isLoading && <p className="mb-3 text-sm text-muted-foreground">Đang tải lịch dạy...</p>}
      {(isError || timetableError) && <p role="alert" className="mb-3 text-sm text-red-600">Chưa tải được đầy đủ lịch. <button className="underline" onClick={() => { if (isError) void refetch(); if (timetableError) void refetchTimetable(); }}>Thử lại</button></p>}
      <WeekCalendarGrid
        events={events}
        selectable
        editable
        onSelectMore={(start, end) => {
          setEditingEvent(null);
          setDefaultDate(start);
          setDefaultHour(start.getHours());
          setDefaultEndTime(format(end, "HH:mm"));
          setDialogOpen(true);
        }}
        onEventChange={async (id, start, end) => {
          await updateLiveSession.mutateAsync({ id, dto: { scheduled_at: vnWallClockToIso(new Date(start)), scheduled_end_at: vnWallClockToIso(new Date(end)) } });
        }}
        onEventClick={handleEventClick}
        onRangeChange={handleRangeChange}
        renderEventTooltip={(event) =>
          event.kind && event.kind !== "livestream" ? (
            <ScheduleEventTooltip event={event} readOnly />
          ) : (
            <ScheduleEventTooltip event={event} editable onEdit={handleEventClick} />
          )
        }
        headerActions={
          <Button
            onClick={() => {
              setEditingEvent(null);
              const next = new Date();
              next.setHours(next.getHours() + 1, 0, 0, 0);
              if (next.getHours() >= 23) { next.setDate(next.getDate() + 1); next.setHours(9, 0, 0, 0); }
              setDefaultDate(next);
              setDefaultHour(next.getHours());
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
        stats={stats}
      />

      <ScheduleEventDetailDialog event={detail} open={!!detail} onOpenChange={open => { if (!open) setDetail(null); }} />
      <ScheduleEventFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={editingEvent}
        defaultDate={defaultDate}
        defaultHour={defaultHour}
        defaultEndTime={defaultEndTime}
        onSave={handleSave}
        onDelete={handleDelete}
        sessionActions={editingEvent && (() => {
          const session = sessionsData?.sessions.find(item => item.id === editingEvent.id);
          return session ? <LiveSessionLaunch key={session.id} id={session.id} status={session.status} /> : null;
        })()}
      />
    </div>
  );
}
