/**
 * Danh sách bài tập code + trắc nghiệm của một khoá (trang /courses/[slug]/exercises).
 *
 * Bối cảnh: `GET /courses/:id/sections` trả lesson KHÔNG có `type` (loại nội dung nay nằm ở
 * `lesson_contents.type`) và thời lượng là `duration_minutes`, không phải `duration`. Code cũ
 * lọc `lesson.type === "quiz"` nên trang luôn rỗng. Bài học được coi là bài tập code khi có ít
 * nhất một content `type: "exercise"` (gắn `exercise_id`) — lấy từ `GET /lessons/:id/contents`.
 *
 * Trắc nghiệm KHÔNG nằm trong `lesson_contents` (ContentType chỉ có video/livestream/exercise),
 * nên phải lấy riêng qua `GET /lessons/:id/quizzes` — route này đã có trên backend và trả
 * `200 {data: []}` khi bài không có quiz (đã thử 2026-10-01 với seed demo).
 */

import { formatLessonDuration } from "@/lib/lesson-duration";
import type { LessonContent } from "@/services/lesson-content.service";
import type { Quiz, QuizAttempt } from "@/services/quiz.service";
import type { Lesson } from "@/types/lesson";
import type { Section } from "@/types/section";

/** `exercise` = bài tập code trong bài học; `quiz` = bài trắc nghiệm gắn với bài học. */
export type CourseTaskKind = "exercise" | "quiz";

export interface ExerciseItem {
  /** Khoá duy nhất trong danh sách: id lesson cho bài tập code, `quiz:<id>` cho trắc nghiệm. */
  id: string;
  kind: CourseTaskKind;
  lessonId: string;
  title: string;
  exerciseId?: string;
  quizId?: string;
  duration: string;
  completed: boolean;
  locked: boolean;
  chapterTitle: string;
  chapterIndex: number;
}

/** Content bài tập đầu tiên của lesson, hoặc `undefined` nếu lesson không có bài tập. */
export function findExerciseContent(
  contents: LessonContent[] | undefined
): LessonContent | undefined {
  return contents?.find((c) => c.type === "exercise");
}

function exerciseDuration(lesson: Lesson, content: LessonContent): string {
  // `lesson_contents.duration` tính bằng GIÂY; thiếu thì lùi về `duration_minutes` của lesson.
  const seconds =
    content.duration && content.duration > 0
      ? content.duration
      : (lesson.duration_minutes ?? 0) * 60;
  return formatLessonDuration(seconds) || "--:--";
}

/**
 * Quiz chỉ tính "hoàn thành" khi có lượt làm ĐẠT. `lesson.progress` nói về video của bài,
 * không nói gì về quiz — bài đã xem xong video vẫn có thể chưa làm quiz.
 */
function isQuizPassed(attempts: QuizAttempt[] | undefined): boolean {
  return attempts?.some((a) => a.is_passed === true) ?? false;
}

/**
 * Ghép sections với content + quiz của từng lesson thành danh sách bài tập.
 * Trong một lesson: bài tập code đứng trước, sau đó tới các quiz.
 * Lesson chưa tải xong content/quiz (không có khoá trong map tương ứng) bị bỏ qua phần đó.
 */
export function mapSectionsToExercises(
  sections: Section[],
  contentsByLesson: Record<string, LessonContent[] | undefined>,
  quizzesByLesson: Record<string, Quiz[] | undefined> = {},
  attemptsByQuiz: Record<string, QuizAttempt[] | undefined> = {}
): ExerciseItem[] {
  return sections.flatMap((section, sIdx) =>
    (section.lessons ?? []).flatMap((lesson) => {
      const base = {
        lessonId: lesson.id,
        // Backend tự tính khoá theo ghi danh / học tuần tự; `is_preview` không nói lên điều đó.
        locked: lesson.locked === true,
        chapterTitle: section.title,
        chapterIndex: sIdx + 1,
      };
      const items: ExerciseItem[] = [];

      const content = findExerciseContent(contentsByLesson[lesson.id]);
      if (content) {
        items.push({
          ...base,
          id: lesson.id,
          kind: "exercise",
          title: lesson.title,
          exerciseId: content.exercise_id,
          duration: exerciseDuration(lesson, content),
          completed: lesson.progress?.status === "completed",
        });
      }

      for (const quiz of quizzesByLesson[lesson.id] ?? []) {
        items.push({
          ...base,
          id: `quiz:${quiz.id}`,
          kind: "quiz",
          title: quiz.title,
          quizId: quiz.id,
          duration: formatLessonDuration((quiz.time_limit_minutes ?? 0) * 60) || "--:--",
          completed: isQuizPassed(attemptsByQuiz[quiz.id]),
        });
      }

      return items;
    })
  );
}

/** Trang làm bài: bài tập code mở trong trình học, trắc nghiệm mở trang quiz riêng. */
export function courseTaskHref(slug: string, item: ExerciseItem): string {
  return item.kind === "quiz" && item.quizId
    ? `/quizzes/${item.quizId}`
    : `/learn/${slug}/${item.lessonId}`;
}
