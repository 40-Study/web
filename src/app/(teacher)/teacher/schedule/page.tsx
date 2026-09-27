"use client";

import { useCallback, useMemo, useState } from "react";
import { addHours, differenceInMinutes } from "date-fns";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import WeekCalendarGrid from "@/components/schedule/week-calendar-grid";
import ScheduleEventTooltip from "@/components/schedule/schedule-event-tooltip";
import ScheduleEventFormDialog from "@/components/schedule/schedule-event-form-dialog";
import type { ScheduleEvent } from "@/components/schedule/week-calendar-grid";
import type { EventFormData } from "@/components/schedule/schedule-event-form-dialog";
import { useAuthStore } from "@/stores/auth.store";
import {
  useLiveSessions,
  useCreateLiveSession,
  useUpdateLiveSession,
  useDeleteLiveSession,
} from "@/hooks/queries/use-live-sessions";
import type { LiveSessionStatus } from "@/services/live-session.service";

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
 * Giới hạn đã biết: backend `PUT /livestream/:id` (dto.UpdateLivestreamDTO)
 * chỉ nhận title/description/max_viewers — không có lịch/giờ/lớp. Vì vậy
 * kéo-thả đổi giờ (drag/resize) và tạo nhanh bằng kéo-chọn ô trống đã bị tắt
 * (`editable={false}`) thay vì âm thầm chỉ đổi state cục bộ rồi mất khi tải
 * lại trang; sửa lịch/giờ sau khi tạo cũng bị khoá ở form dialog.
 */
export default function TeacherSchedulePage() {
  const { user } = useAuthStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [defaultDate, setDefaultDate] = useState<Date | undefined>();
  const [defaultHour, setDefaultHour] = useState<number | undefined>();

  const { data: sessionsData, isLoading } = useLiveSessions(
    user?.id ? { host_id: user.id, page_size: 100 } : undefined
  );
  const createLiveSession = useCreateLiveSession();
  const updateLiveSession = useUpdateLiveSession();
  const deleteLiveSession = useDeleteLiveSession();

  const events: ScheduleEvent[] = useMemo(() => {
    const sessions = sessionsData?.sessions ?? [];
    return sessions.map((s): ScheduleEvent => {
      const start = new Date(s.scheduled_at ?? s.created_at);
      // Backend không lưu thời lượng dự kiến — mặc định 1 giờ chỉ để vẽ khối
      // lịch, không phải giá trị đã lưu; buổi đã kết thúc dùng ended_at thật.
      const end = s.ended_at ? new Date(s.ended_at) : addHours(start, 1);
      return {
        id: s.id,
        title: s.title,
        courseId: s.course_id,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        type: "livestream",
        status: mapStatus(s.status),
        description: s.description || undefined,
        teacher: "Bạn",
      };
    });
  }, [sessionsData]);

  // Số giờ dạy thật trong các buổi đã lấy về — thay cho con số "18" cứng
  // trước đây. Số liệu tasks/focus chưa có nguồn thật nên để 0 thay vì bịa.
  const studyHours = useMemo(
    () =>
      Math.round(
        events.reduce(
          (sum, e) => sum + differenceInMinutes(new Date(e.endTime), new Date(e.startTime)) / 60,
          0
        )
      ),
    [events]
  );

  const handleEventClick = useCallback((event: ScheduleEvent) => {
    setEditingEvent(event);
    setDefaultDate(undefined);
    setDefaultHour(undefined);
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(
    (data: EventFormData, eventId?: string) => {
      if (eventId) {
        updateLiveSession.mutate({
          id: eventId,
          dto: { title: data.title, description: data.description || undefined },
        });
        return;
      }
      if (!data.classId) return;
      createLiveSession.mutate({
        title: data.title,
        description: data.description || undefined,
        class_id: data.classId,
        course_id: data.courseId || undefined,
        scheduled_at: data.startTime,
      });
    },
    [createLiveSession, updateLiveSession]
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
        // Tắt kéo-thả đổi giờ/tạo nhanh: backend chưa hỗ trợ đổi lịch sau khi
        // tạo (xem ghi chú đầu file) — bật lên sẽ tạo cảm giác "đã lưu" giả.
        editable={false}
        onEventClick={handleEventClick}
        renderEventTooltip={(event) => (
          <ScheduleEventTooltip event={event} editable onEdit={handleEventClick} />
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
            className="gap-1 rounded-full"
          >
            <Plus className="w-4 h-4" />
            Tạo buổi học
          </Button>
        }
        stats={{
          studyHours,
          tasksCompleted: 0,
          tasksTotal: 0,
          focusPercent: 0,
        }}
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

function mapStatus(status: LiveSessionStatus): ScheduleEvent["status"] {
  if (status === "live") return "ongoing";
  if (status === "ended") return "completed";
  return "upcoming";
}
