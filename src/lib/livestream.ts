/**
 * Logic thuần cho buổi học trực tiếp — tách khỏi component để test được.
 *
 * Bối cảnh (Phase 0 review, finding #1 + #2):
 * `POST /livestream` dùng `dto.CreateLivestreamDTO`
 * (backend/internal/dto/livestreamDTO.go) và CHỈ nhận:
 * `title`, `description`, `host_id`, `class_id`, `course_id`,
 * `lesson_content_id`, `max_viewers`, `is_recorded`, `scheduled_at`.
 *
 * Form cũ còn thu thêm `duration`, `platform`, `customLink`, `enableReminder`
 * — backend không có field nào tương ứng, nên chúng bị bỏ im lặng. Các field
 * đó đã được bỏ khỏi modal; module này giữ phần map dữ liệu còn lại.
 */

import type { CreateLiveSessionDTO } from "@/services/live-session.service";

/** Số lớp của khoá từ mức này trở lên thì giáo viên BẮT BUỘC chọn lớp. */
export const CLASS_SELECTION_THRESHOLD = 2;

/** Khoá có ≥2 lớp thì phải hỏi giáo viên chọn lớp cho buổi live. */
export function requiresClassSelection(classCount: number): boolean {
  return classCount >= CLASS_SELECTION_THRESHOLD;
}

/**
 * Xác định `class_id` sẽ gửi lên backend từ danh sách lớp của khoá.
 *
 * - 0 lớp → `null` (chưa thể tạo buổi live; trang gọi hiện toast hướng dẫn).
 * - 1 lớp → tự dùng lớp đó, không cần hỏi.
 * - ≥2 lớp → chỉ dùng khi giáo viên đã chọn và `selectedClassId` khớp một lớp
 *   có thật trong danh sách (chặn cả trường hợp id cũ còn sót lại sau khi
 *   đổi khoá).
 */
export function resolveLivestreamClassId<T extends { id: string }>(
  classes: T[],
  selectedClassId?: string | null
): string | null {
  if (classes.length === 0) return null;
  if (classes.length === 1) return classes[0].id;
  return classes.find((c) => c.id === selectedClassId)?.id ?? null;
}

/**
 * Ghép ngày + giờ của form thành chuỗi ISO cho `scheduled_at`.
 *
 * Trả `undefined` khi thiếu một trong hai, hoặc khi ghép ra ngày không hợp lệ
 * — backend parse bằng `time.Parse(time.RFC3339, …)` và **bỏ qua im lặng** khi
 * lỗi, nên gửi chuỗi rác sẽ tạo buổi live không có lịch.
 */
export function buildScheduledAt(date?: string, time?: string): string | undefined {
  if (!date || !time) return undefined;
  const parsed = new Date(`${date}T${time}:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

/** Dữ liệu buổi live mà modal thu thập (`LivestreamContentData`). */
export interface LivestreamFormInput {
  title: string;
  description?: string;
  date?: string;
  startTime?: string;
  /** Đã chọn lớp hay chưa — `null` khi khoá chưa có lớp nào. */
  classId?: string | null;
  enableRecording?: boolean;
}

export interface LivestreamCreateContext {
  hostId: string;
  courseId: string;
  classId: string;
}

/**
 * Map dữ liệu form → `dto.CreateLivestreamDTO`.
 *
 * KHÔNG gửi `lesson_content_id`. `currentLessonId` ở trang giáo viên là id của
 * **lesson** (`openAddContentModal(lesson.id)` từ `SortableLessonRow`), trong
 * khi `CreateLivestreamDTO.LessonContentID` là id của **lesson_content** — bằng
 * chứng: `class_lesson_content_service.go` truyền `clc.LessonContentID`. Gửi id
 * lesson vào đó sẽ hỏng khoá ngoại, nên bỏ hẳn liên kết. Quyết định này được
 * ghi lại trong report của Phase 0.
 */
export function buildLivestreamCreatePayload(
  input: LivestreamFormInput,
  ctx: LivestreamCreateContext
): CreateLiveSessionDTO {
  return {
    title: input.title,
    description: input.description || undefined,
    host_id: ctx.hostId,
    class_id: ctx.classId,
    course_id: ctx.courseId,
    scheduled_at: buildScheduledAt(input.date, input.startTime),
    is_recorded: input.enableRecording ?? false,
  };
}
