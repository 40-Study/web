import { describe, expect, it } from "vitest";
import { courseTaskHref, mapSectionsToExercises } from "@/lib/course-exercises";
import type { LessonContent } from "@/services/lesson-content.service";
import type { Quiz, QuizAttempt } from "@/services/quiz.service";
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
        kind: "exercise",
        lessonId: "33dfd05c",
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

// Rút gọn từ GET /courses/:id/sections + GET /lessons/:id/contents + GET /lessons/:id/quizzes
// thật của khoá git-github-cho-nguoi-moi-bat-dau (student1, seed demo 2026-10-01). Content chỉ có
// `video` — quiz CHỈ lộ ra qua /lessons/:id/quizzes.
const gitSections = [
  {
    id: "95b3d51a",
    course_id: "19cd12b2",
    title: "Bắt đầu với Git",
    display_order: 1,
    lessons: [
      {
        id: "29663076", section_id: "95b3d51a", title: "Cài đặt và cấu hình Git", display_order: 1,
        duration_minutes: 10, is_preview: true, locked: false, lock_reason: null,
        progress: { status: "completed", watched_pct: 0, last_position_seconds: 600 },
      },
      {
        id: "7feecafc", section_id: "95b3d51a", title: "Commit, log và undo", display_order: 2,
        duration_minutes: 18, is_preview: false, locked: false, lock_reason: null,
      },
    ],
  },
] as unknown as Section[];

const gitContents: Record<string, LessonContent[]> = {
  "29663076": [{ id: "c1", lesson_id: "29663076", type: "video", title: "Cài đặt", duration: 600, display_order: 1 }],
  "7feecafc": [{ id: "c2", lesson_id: "7feecafc", type: "video", title: "Commit", duration: 1080, display_order: 1 }],
};

const gitQuizzes = {
  "29663076": [
    {
      id: "359ce8f7-c675-439d-962e-8b36098813b6", lesson_id: "29663076", course_id: "19cd12b2",
      title: "Kiểm tra: Cài đặt và cấu hình Git", description: "Ba câu hỏi về cấu hình Git lần đầu.",
      time_limit_minutes: 15, pass_percentage: 70, max_attempts: 5, trigger_type: "manual",
      shuffle_questions: true, shuffle_answers: true, show_correct_answers: true, question_count: 0,
    },
  ],
  "7feecafc": [],
} as unknown as Record<string, Quiz[]>;

describe("mapSectionsToExercises — trắc nghiệm", () => {
  it("thêm quiz lấy từ /lessons/:id/quizzes, phân biệt kind và không lẫn với tiến độ video", () => {
    // Bài 1 đã `completed` (xem xong video) nhưng chưa có lượt làm quiz → quiz CHƯA hoàn thành.
    const items = mapSectionsToExercises(gitSections, gitContents, gitQuizzes, {});
    expect(items).toEqual([
      {
        id: "quiz:359ce8f7-c675-439d-962e-8b36098813b6",
        kind: "quiz",
        lessonId: "29663076",
        title: "Kiểm tra: Cài đặt và cấu hình Git",
        quizId: "359ce8f7-c675-439d-962e-8b36098813b6",
        duration: "15:00",
        completed: false,
        locked: false,
        chapterTitle: "Bắt đầu với Git",
        chapterIndex: 1,
      },
    ]);
  });

  it("quiz hoàn thành khi có lượt làm đạt; lượt trượt không tính", () => {
    const quizId = "359ce8f7-c675-439d-962e-8b36098813b6";
    const failed = [{ id: "a1", quiz_id: quizId, user_id: "u", is_passed: false, started_at: "x" }] as QuizAttempt[];
    const passed = [...failed, { id: "a2", quiz_id: quizId, user_id: "u", is_passed: true, started_at: "y" }] as QuizAttempt[];
    expect(mapSectionsToExercises(gitSections, gitContents, gitQuizzes, { [quizId]: failed })[0].completed).toBe(false);
    expect(mapSectionsToExercises(gitSections, gitContents, gitQuizzes, { [quizId]: passed })[0].completed).toBe(true);
  });

  it("bài có cả bài tập code lẫn quiz: code trước, quiz sau, id không trùng", () => {
    const both = { "33dfd05c": [{ ...gitQuizzes["29663076"][0], id: "q-todo", lesson_id: "33dfd05c" }] };
    const items = mapSectionsToExercises(sections, contents, both, {});
    expect(items.map((i) => [i.kind, i.id])).toEqual([
      ["exercise", "33dfd05c"],
      ["quiz", "quiz:q-todo"],
    ]);
  });

  it("link: bài tập code vào trình học, trắc nghiệm vào trang quiz", () => {
    const [exercise] = mapSectionsToExercises(sections, contents);
    const [quiz] = mapSectionsToExercises(gitSections, gitContents, gitQuizzes);
    expect(courseTaskHref("react-nextjs-tu-co-ban-den-nang-cao", exercise)).toBe(
      "/learn/react-nextjs-tu-co-ban-den-nang-cao/33dfd05c"
    );
    expect(courseTaskHref("git-github-cho-nguoi-moi-bat-dau", quiz)).toBe(
      "/quizzes/359ce8f7-c675-439d-962e-8b36098813b6"
    );
  });
});
