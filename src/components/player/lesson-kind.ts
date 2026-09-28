import type { LessonContent } from "@/services/lesson-content.service";

export type NonVideoLessonKind = "exercise" | "livestream";
export type LessonKind = "video" | NonVideoLessonKind;

/**
 * Loại nội dung chính của bài — A2, QA vòng 2 (N6).
 *
 * Curriculum (`GET /courses/:id/sections`) KHÔNG trả `type` cho bài học
 * (`lesson.type` đã deprecated, luôn rỗng), nên nhánh "exercise" cũ của trang
 * học không bao giờ chạy và bài tập rơi vào nhánh video ("Video không khả
 * dụng"). Nguồn thật là `lesson_contents[].type`: có content video thì là bài
 * video; không có mà có bài tập/buổi live thì là bài không-video. Chưa tải xong
 * content → coi như video (giữ khung loading của video như trước).
 */
export function resolveLessonKind(contents: Pick<LessonContent, "type" | "display_order">[] | undefined): LessonKind {
  if (!contents || contents.length === 0) return "video";
  if (contents.some((c) => c.type === "video")) return "video";
  const primary = [...contents].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))[0];
  if (primary.type === "livestream") return "livestream";
  if (primary.type === "exercise") return "exercise";
  return "video";
}
