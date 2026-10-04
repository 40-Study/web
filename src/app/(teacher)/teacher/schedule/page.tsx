"use client";

import { useCallback, useMemo, useState } from "react";
import { differenceInMinutes } from "date-fns";
import { CalendarCheck, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import WeekCalendarGrid from "@/components/schedule/week-calendar-grid";
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

/**
 * P1 QA 260927 teacher: trang này trước bản vá chỉ có state React cục bộ
 * (`useState<ScheduleEvent[]>([])`) — "Tạo buổi học" không gọi API nào cả.
 * Buổi học tạo ở đây biến mất khi tải lại trang, và vì không có bản ghi thật
 * ở backend (không có class_id/course_id) nên nó không bao giờ xuất hiện ở
 * trang Bài tập (liệt kê session thật theo course qua
 * `useTeacherLivestreamsForCourse`) — đây là NGUYÊN NHÂN GỐC của phát hiện
 * "giao bài tập không dùng được".
 *
 * Nay mỗi "buổi học" ở trang này là một `livestream_sessions` row thật
 * (POST /livestream, khớp đúng luồng đã hoạt động ở trang chi tiết khóa học >
 * Thêm nội dung > Livestream), đòi buộc chọn khóa học + lớp lúc tạo.
 *
 * QA hồi quy 03/10:
 * - B-09: form gửi đủ giờ kết thúc và phòng học; PUT /livestream/:id nay nhận cả lịch nên sửa buổi đổi
 *   được giờ (chỉ khi buổi chưa bắt đầu). Kéo-thả đổi giờ vẫn tắt (`editable={false}`): chỉnh giờ qua form
 *   để có kiểm tra giờ và thông báo lỗi rõ ràng.
 * - B-08: ngoài livestream, lịch còn vẽ lịch học lặp tuần và buổi học cụ thể của các lớp mình dạy
 *   (`GET /me/timetable?sessions_from&sessions_to`). Hai loại này chỉ để xem; chỉnh ở trang Quản lý lớp.
 */
export default function TeacherSchedulePage() {
  const { user } = useAuthStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [defaultDate, setDefaultDate] = useState<Date | undefined>();
  const [defaultHour, setDefaultHour] = useState<number | undefined>();
  const [range, setRange] = useState<{ from: string; to: string } | undefined>();

  const { data: sessionsData, isLoading } = useLiveSessions(
    user?.id ? { host_id: user.id, page_size: 100 } : undefined
  );
  const { data: timetableEntries } = useMyTimetableEntries(range);
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
    if (event.kind && event.kind !== "livestream") return;
    setEditingEvent(event);
    setDefaultDate(undefined);
    setDefaultHour(undefined);
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(
    (data: EventFormData, eventId?: string) => {
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
        updateLiveSession.mutate({ id: eventId, dto });
        return;
      }
      if (!data.classId) return;
      createLiveSession.mutate({
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
    (eventId: string) => {
      deleteLiveSession.mutate(eventId);
    },
    [deleteLiveSession]
  );

  return (
    <div className="p-6">
      {isLoading && <p className="mb-3 text-sm text-muted-foreground">Đang tải lịch dạy...</p>}
      <WeekCalendarGrid
        events={events}
        // Tắt kéo-thả đổi giờ/tạo nhanh: đổi giờ đi qua form (có kiểm tra giờ và báo lỗi từ backend)
        // thay vì thả chuột rồi mới biết bị từ chối.
        editable={false}
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
              setDefaultDate(new Date());
              setDefaultHour(8);
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

      <ScheduleEventFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={editingEvent}
        defaultDate={defaultDate}
        defaultHour={defaultHour}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
