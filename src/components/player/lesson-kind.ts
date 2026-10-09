import type { LessonContent } from "@/services/lesson-content.service";
import type { PlayerLesson } from "@/types/course-player";

export type NonVideoLessonKind = "exercise" | "livestream";
export type LessonKind = "video" | NonVideoLessonKind | "article" | "quiz";

type KindSource = Pick<LessonContent, "type" | "display_order">;

/**
 * Content CHÍNH của bài — nguồn để chọn cách hiển thị.
 *
 * Có content video thì video là chính (giữ hành vi cũ: bài có video luôn phát video); không có thì
 * lấy content có `display_order` nhỏ nhất. `undefined` khi chưa có/chưa tải content.
 */
export function pickPrimaryContent<T extends KindSource>(contents: T[] | undefined): T | undefined {
  if (!contents || contents.length === 0) return undefined;
  const byOrder = (a: T, b: T) => (a.display_order ?? 0) - (b.display_order ?? 0);
  const video = contents.filter((c) => c.type === "video").sort(byOrder)[0];
  return video ?? [...contents].sort(byOrder)[0];
}

/**
 * Loại nội dung chính của bài — A2, QA vòng 2 (N6); mở rộng article/quiz (QA 261008 T1/T7).
 *
 * Curriculum (`GET /courses/:id/sections`) KHÔNG trả `type` cho bài học
 * (`lesson.type` đã deprecated, luôn rỗng), nên nhánh "exercise" cũ của trang
 * học không bao giờ chạy và bài tập rơi vào nhánh video ("Video không khả
 * dụng"). Nguồn thật là `lesson_contents[].type`: có content video thì là bài
 * video; không có mà có bài viết/trắc nghiệm/bài tập/buổi live thì là bài tương
 * ứng. Chưa tải xong content → coi như video (giữ khung loading của video như trước).
 */
export function resolveLessonKind(contents: KindSource[] | undefined): LessonKind {
  const primary = pickPrimaryContent(contents);
  switch (primary?.type) {
    case "livestream":
    case "exercise":
    case "article":
    case "quiz":
      return primary.type;
    default:
      return "video";
  }
}

/**
 * Id các quiz ĐANG hiện ra như nội dung chính của bài (content `quiz` đứng đầu). Quiz của bài có
 * hai đường tới màn hình — hàng `lesson_contents` type `quiz` và `GET /lessons/:id/quizzes` — nên
 * tab Quiz của player phải bỏ những id này (D2), nếu không cùng một quiz hiện hai lần.
 *
 * Chỉ tính quiz thật sự được hiển thị làm nội dung chính: một hàng content `quiz` nằm sau video/bài
 * viết không được hiện ở đâu cả, nên vẫn phải còn trong tab thay vì biến mất.
 */
export function quizIdsShownAsContent(contents: (KindSource & Pick<LessonContent, "quiz_id">)[] | undefined): Set<string> {
  const primary = pickPrimaryContent(contents);
  return primary?.type === "quiz" && primary.quiz_id ? new Set([primary.quiz_id]) : new Set();
}

/** Danh sách quiz cho tab Quiz của player: bỏ quiz đã hiện làm nội dung chính. */
export function quizzesForTab<Q extends { id: string }>(
  quizzes: Q[] | undefined,
  contents: (KindSource & Pick<LessonContent, "quiz_id">)[] | undefined
): Q[] {
  const shown = quizIdsShownAsContent(contents);
  return (quizzes ?? []).filter((q) => !shown.has(q.id));
}

/**
 * `PlayerLesson.type` (sidebar, đếm bài tập) theo loại nội dung chính. Curriculum không trả loại bài
 * học (`Lesson.type` deprecated, luôn rỗng) nên chỉ BÀI ĐANG XEM biết được loại thật — các bài khác
 * mặc định "video" cho tới khi được mở.
 */
export function toPlayerLessonType(kind: LessonKind): PlayerLesson["type"] {
  switch (kind) {
    case "article":
      return "reading";
    case "quiz":
    case "exercise":
      return kind;
    default:
      return "video";
  }
}
