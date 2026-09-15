/**
 * Logic thuần cho buổi học trực tiếp — tách khỏi component để test được.
 *
 * Bối cảnh (Phase 0 review, finding #1 + #2; vòng 3 M-5):
 * `POST /livestream` dùng `dto.CreateLivestreamDTO`
 * (backend/internal/dto/livestreamDTO.go) và CHỈ nhận:
 * `title`, `description`, `class_id`, `course_id`, `lesson_content_id`,
 * `max_viewers`, `is_recorded`, `scheduled_at`.
 *
 * `host_id` KHÔNG còn trong DTO: backend lấy host từ access token
 * (`LivestreamHandler.Create` → `extractUserID(c)`) — trước đây nhận từ body nên
 * bất kỳ user đăng nhập nào cũng tạo được phiên mang tên người khác.
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
  courseId: string;
  classId: string;
  /**
   * Id của **lesson_content** (không phải lesson) mà buổi live thuộc về.
   *
   * Chỉ có khi buổi live được tạo từ bên trong một bài học: luồng tạo
   * `lesson_content` type `livestream` chạy trước (xem `submitLivestreamContent`),
   * rồi id vừa tạo được truyền vào đây. Tạo ngoài bài học thì bỏ trống.
   */
  lessonContentId?: string;
}

/**
 * Map dữ liệu form → `dto.CreateLivestreamDTO`.
 *
 * `lesson_content_id` là id của **lesson_content**, KHÔNG phải id của lesson:
 * `CreateLivestreamDTO.LessonContentID` trỏ tới `lesson_content`
 * (`class_lesson_content_service.go` truyền `clc.LessonContentID`). `currentLessonId`
 * ở trang giáo viên là id **lesson**, nên nó không được truyền thẳng vào đây —
 * `submitLivestreamContent` phải tạo `lesson_content` trước để lấy đúng id.
 *
 * KHÔNG gửi `host_id`: backend lấy host từ access token và đã bỏ field này khỏi
 * `CreateLivestreamDTO` (Phase 0 vòng 3, M-5).
 */
export function buildLivestreamCreatePayload(
  input: LivestreamFormInput,
  ctx: LivestreamCreateContext
): CreateLiveSessionDTO {
  return {
    title: input.title,
    description: input.description || undefined,
    class_id: ctx.classId,
    course_id: ctx.courseId,
    lesson_content_id: ctx.lessonContentId,
    scheduled_at: buildScheduledAt(input.date, input.startTime),
    is_recorded: input.enableRecording ?? false,
  };
}

/** Dịch vụ mà `submitLivestreamContent` cần — tiêm vào để test không cần mạng. */
export interface LivestreamSubmitDeps {
  /** `lessonContentService.createContent(lessonId, { type: "livestream", … })`. */
  createLessonContent: (dto: { type: "livestream"; title: string }) => Promise<{ id: string }>;
  /** `liveSessionService.create(dto)`. */
  createSession: (dto: CreateLiveSessionDTO) => Promise<unknown>;
  /** `lessonContentService.deleteContent(lessonId, contentId)` — dọn mục mồ côi. */
  deleteLessonContent: (contentId: string) => Promise<unknown>;
}

/**
 * Tạo buổi live từ trong một bài học (M-1, quyết định vòng 3).
 *
 * Thứ tự bắt buộc — buổi live tạo từ bên trong bài học PHẢI xuất hiện trong danh
 * sách nội dung của bài học đó:
 *
 * 1. Tạo `lesson_content` type `livestream` (đúng đường nhánh video đang dùng).
 * 2. Lấy `id` vừa tạo, đưa vào `lesson_content_id` của `POST /livestream`.
 *
 * `lessonId === null` = modal mở ngoài bài học → tạo phiên rời, không có
 * `lesson_content_id`.
 *
 * Ném lỗi khi bước 1 hỏng (chưa có gì để dọn). Bước 2 hỏng thì **không ném**:
 * `useCreateLiveSession.onError` đã toast lỗi thật kèm message, ném tiếp sẽ
 * khiến `catch` ở trang bắn thêm toast chung chung (M-4). Thay vào đó
 * `lesson_content` vừa tạo được gỡ để bài học không còn mục live mồ côi.
 */
export async function submitLivestreamContent(
  input: LivestreamFormInput,
  ctx: { courseId: string; classId: string; lessonId?: string | null },
  deps: LivestreamSubmitDeps
): Promise<{ created: boolean; lessonContentId?: string }> {
  const lessonId = ctx.lessonId ?? null;

  let lessonContentId: string | undefined;
  if (lessonId) {
    const content = await deps.createLessonContent({ type: "livestream", title: input.title });
    lessonContentId = content.id;
  }

  try {
    await deps.createSession(
      buildLivestreamCreatePayload(input, {
        courseId: ctx.courseId,
        classId: ctx.classId,
        lessonContentId,
      })
    );
    return { created: true, lessonContentId };
  } catch {
    if (lessonId && lessonContentId) {
      // Best-effort: mục mồ côi không nên chặn luồng báo lỗi chính.
      try {
        await deps.deleteLessonContent(lessonContentId);
      } catch {
        // Đã có toast lỗi thật từ mutation; dọn hỏng chỉ ghi log để không dội toast.
        console.warn("[livestream] Không gỡ được lesson_content mồ côi:", lessonContentId);
      }
    }
    return { created: false, lessonContentId };
  }
}
