/**
 * Danh sách bài tập code của một khoá (trang /courses/[slug]/exercises).
 *
 * Bối cảnh: `GET /courses/:id/sections` trả lesson KHÔNG có `type` (loại nội dung nay nằm ở
 * `lesson_contents.type`) và thời lượng là `duration_minutes`, không phải `duration`. Code cũ
 * lọc `lesson.type === "quiz"` nên trang luôn rỗng. Bài học được coi là bài tập khi có ít nhất
 * một content `type: "exercise"` (gắn `exercise_id`) — lấy từ `GET /lessons/:id/contents`.
 */

import { formatLessonDuration } from "@/lib/lesson-duration";
import type { LessonContent } from "@/services/lesson-content.service";
import type { Lesson } from "@/types/lesson";
import type { Section } from "@/types/section";

export interface ExerciseItem {
  id: string;
  title: string;
  exerciseId?: string;
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
 * Ghép sections với content của từng lesson thành danh sách bài tập.
 * Lesson chưa tải xong content (không có khoá trong `contentsByLesson`) bị bỏ qua.
 */
export function mapSectionsToExercises(
  sections: Section[],
  contentsByLesson: Record<string, LessonContent[] | undefined>
): ExerciseItem[] {
  return sections.flatMap((section, sIdx) =>
    (section.lessons ?? []).flatMap((lesson) => {
      const content = findExerciseContent(contentsByLesson[lesson.id]);
      if (!content) return [];
      return [
        {
          id: lesson.id,
          title: lesson.title,
          exerciseId: content.exercise_id,
          duration: exerciseDuration(lesson, content),
          completed: lesson.progress?.status === "completed",
          // Backend tự tính khoá theo ghi danh / học tuần tự; `is_preview` không nói lên điều đó.
          locked: lesson.locked === true,
          chapterTitle: section.title,
          chapterIndex: sIdx + 1,
        },
      ];
    })
  );
}
