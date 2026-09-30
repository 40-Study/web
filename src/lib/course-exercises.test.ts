import { describe, expect, it } from "vitest";
import { mapSectionsToExercises } from "@/lib/course-exercises";
import type { LessonContent } from "@/services/lesson-content.service";
import type { Section } from "@/types/section";

// Rút gọn từ GET /courses/:id/sections + GET /lessons/:id/contents thật của khoá
// react-nextjs-tu-co-ban-den-nang-cao (student1, seed demo 2026-10-01). Lesson KHÔNG có `type`.
const sections = [
  {
    id: "sec-2",
    course_id: "f42ab41f",
    title: "React Fundamentals",
    display_order: 2,
    lessons: [
      {
        id: "82bba423", section_id: "sec-2", title: "Components & Props", display_order: 1,
        duration_minutes: 20, is_preview: false, locked: false,
        progress: { status: "completed", watched_pct: 0, last_position_seconds: 1200 },
      },
      {
        id: "33dfd05c", section_id: "sec-2", title: "Bài tập thực hành: Todo App", display_order: 3,
        duration_minutes: 30, is_preview: false, locked: false,
        progress: { status: "in_progress", watched_pct: 0, last_position_seconds: 720 },
      },
    ],
  },
] as unknown as Section[];

const contents: Record<string, LessonContent[]> = {
  "82bba423": [
    { id: "080f8b72", lesson_id: "82bba423", type: "video", title: "Components & Props", duration: 5, display_order: 1 },
  ],
  "33dfd05c": [
    {
      id: "814ecfe0", lesson_id: "33dfd05c", type: "exercise", title: "Bài tập thực hành: Todo App",
      duration: 1800, exercise_id: "1decbba7-820f-4272-b53e-e52d424394a0", display_order: 1,
    },
  ],
};

describe("mapSectionsToExercises", () => {
  it("nhận ra bài tập qua content type 'exercise' dù lesson không có `type`", () => {
    const items = mapSectionsToExercises(sections, contents);
    expect(items).toEqual([
      {
        id: "33dfd05c",
        title: "Bài tập thực hành: Todo App",
        exerciseId: "1decbba7-820f-4272-b53e-e52d424394a0",
        duration: "30:00",
        completed: false,
        locked: false,
        chapterTitle: "React Fundamentals",
        chapterIndex: 1,
      },
    ]);
  });

  it("lùi về duration_minutes khi content không có duration, và đọc locked/progress thật", () => {
    const lessons = sections[0].lessons!;
    const locked = [{ ...sections[0], lessons: [{ ...lessons[1], locked: true, progress: { status: "completed" } }] }] as unknown as Section[];
    const noDuration = { "33dfd05c": [{ ...contents["33dfd05c"][0], duration: undefined }] };
    const [item] = mapSectionsToExercises(locked, noDuration);
    expect(item).toMatchObject({ duration: "30:00", locked: true, completed: true });
  });

  it("bỏ qua lesson chưa tải content hoặc không có bài tập", () => {
    expect(mapSectionsToExercises(sections, {})).toEqual([]);
    expect(mapSectionsToExercises(sections, { "82bba423": contents["82bba423"] })).toEqual([]);
  });
});
