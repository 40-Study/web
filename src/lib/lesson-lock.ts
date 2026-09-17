/**
 * Khoá học tuần tự + lý do khoá (contract §2) và microcopy tương ứng (bước 9).
 *
 * Backend là nơi quyết định `locked`/`lock_reason`; ở đây chỉ diễn giải chúng cho
 * UI. Giữ luật ở dạng hàm thuần để test được mà không cần render player.
 */

import type { PlayerLesson, PlayerCourse } from "@/types/course-player";

/** Lý do khoá theo contract §2 (`lock_reason` là chuỗi tự do từ server). */
export type LockReason = "previous_incomplete" | "not_enrolled" | null;

/** Câu thông báo riêng cho từng lý do — không dùng chung một câu chung chung. */
export const LOCK_REASON_MESSAGE: Record<Exclude<LockReason, null>, string> = {
  previous_incomplete: "Vui lòng hoàn thành bài học hiện tại",
  not_enrolled: "Bạn cần tham gia khoá học để mở bài này",
};

/** Câu dùng khi server báo khoá nhưng không kèm lý do cụ thể. */
export const LOCKED_FALLBACK_MESSAGE = "Bài học này chưa mở";

/** Câu hiển thị khi tải nội dung bài thất bại (bước 9 — trấn an người học). */
export const LESSON_LOAD_ERROR_MESSAGE = "Không tải được bài học. Tiến trình học của bạn không bị ảnh hưởng.";

/** Chuẩn hoá `lock_reason` tự do từ server về tập đã biết. */
export function normalizeLockReason(raw: string | null | undefined): LockReason {
  if (raw === "previous_incomplete" || raw === "not_enrolled") return raw;
  return null;
}

/** Câu hiển thị cho một bài bị khoá. */
export function describeLock(lesson: Pick<PlayerLesson, "locked" | "lockReason">): string | null {
  if (!lesson.locked) return null;
  return LOCK_REASON_MESSAGE[normalizeLockReason(lesson.lockReason) ?? "previous_incomplete"];
}

/** Câu hỏi nhanh cho một bài: có mở được không, và nếu không thì vì sao. */
export function canOpenLesson(lesson: Pick<PlayerLesson, "locked">): boolean {
  return !lesson.locked;
}

/**
 * Duyệt danh sách bài theo đúng thứ tự chương → bài (contract §2: "theo `order`
 * trong cùng khoá"). Trả về danh sách phẳng để tra bài trước/kế tiếp.
 */
export function flattenLessons(course: Pick<PlayerCourse, "chapters">): PlayerLesson[] {
  return course.chapters.flatMap((chapter) => chapter.lessons);
}

/** Bài kế tiếp trong khoá, `undefined` nếu đang ở bài cuối. */
export function findNextLesson(
  course: Pick<PlayerCourse, "chapters">,
  lessonId: string
): PlayerLesson | undefined {
  const lessons = flattenLessons(course);
  const index = lessons.findIndex((l) => l.id === lessonId);
  return index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : undefined;
}

/** Bài trước đó trong khoá, `undefined` nếu đang ở bài đầu. */
export function findPreviousLesson(
  course: Pick<PlayerCourse, "chapters">,
  lessonId: string
): PlayerLesson | undefined {
  const lessons = flattenLessons(course);
  const index = lessons.findIndex((l) => l.id === lessonId);
  return index > 0 ? lessons[index - 1] : undefined;
}

/** Vị trí resume (giây) — `null`/`0` nghĩa là bắt đầu từ đầu. */
export function resolveResumeSeconds(
  lastPositionSeconds: number | null | undefined,
  durationSeconds?: number | null
): number {
  if (typeof lastPositionSeconds !== "number" || !Number.isFinite(lastPositionSeconds)) return 0;
  if (lastPositionSeconds <= 0) return 0;
  if (typeof durationSeconds !== "number" || durationSeconds <= 0) return lastPositionSeconds;

  // Vị trí vượt thời lượng = dữ liệu cũ (video đã được mã hoá lại ngắn hơn),
  // KHÔNG phải "đã xem gần hết". Kẹp về cuối video, đừng nhảy về 0.
  if (lastPositionSeconds > durationSeconds) return durationSeconds;

  // Xem gần hết (>=95%) mà chưa `completed` thì coi như đã xong lượt đó; resume
  // về 0 dễ chịu hơn là mở lại đúng 5 giây cuối.
  return lastPositionSeconds / durationSeconds >= 0.95 ? 0 : lastPositionSeconds;
}
