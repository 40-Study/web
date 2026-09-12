/**
 * Server-side curriculum fetcher for course player
 */

import { serverApi, HttpError } from "@/lib/server-api";
import type { PlayerCurriculum } from "@/hooks/use-course-player";

interface ApiCourse {
  id: string;
  title: string;
  slug?: string;
  instructor?: { name?: string };
}

interface ApiSection {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  display_order: number;
  position?: number; // Some APIs return position instead of display_order
}

interface ApiLesson {
  id: string;
  title: string;
  description?: string;
  duration_minutes?: number;
  position: number;
}

interface ApiLessonContent {
  id: string;
  type: string;
  video_url?: string;
  video_hls_url?: string;
  exercise_id?: string;
}

interface ApiQuiz {
  id: string;
  title: string;
}

/**
 * Fetch full course curriculum on the server
 * This replaces the client-side useCourseCurriculum hook for initial data
 */
export async function fetchCurriculum(courseSlug: string): Promise<PlayerCurriculum | null> {
  try {
    // 1. Get course by slug
    const course = await serverApi.get<ApiCourse>(`/courses/slug/${courseSlug}`);

    // 2. Get all sections
    const sectionsResponse = await serverApi.get<{ sections: ApiSection[] }>(
      `/courses/${course.id}/sections`
    );
    const sections = sectionsResponse.sections || [];

    // 3. Fetch all lessons for ALL sections in parallel.
    // KHÔNG bắt lỗi ở đây: trước đây một section lỗi bị thay bằng `lessons: []`,
    // nên người học thấy curriculum thiếu hẳn chương đó mà không có thông báo
    // nào — đúng kiểu "nuốt lỗi im lặng" mà trang này phải tránh. Lỗi sẽ ném
    // lên và được xử lý ở catch ngoài cùng bên dưới.
    const allLessonsPromises = sections.map((section) =>
      serverApi
        .get<{ lessons: ApiLesson[] }>(`/sections/${section.id}/lessons`)
        .then((res) => ({
          sectionId: section.id,
          lessons: res.lessons || [],
        }))
    );
    const allLessonsResults = await Promise.all(allLessonsPromises);

    // Create a map for quick lookup
    const lessonsBySectionId = new Map(
      allLessonsResults.map((r) => [r.sectionId, r.lessons])
    );

    // 4. Collect ALL lesson IDs and fetch contents + quizzes in parallel
    const allLessons = allLessonsResults.flatMap((r) => r.lessons);
    const allLessonIds = allLessons.map((l) => l.id);

    // Fetch all contents and quizzes in parallel
    const [allContentsResults, allQuizzesResults] = await Promise.all([
      // Fetch all lesson contents in parallel.
      // 404 = bài học chưa có nội dung, coi như danh sách rỗng. Mọi lỗi khác
      // (mất mạng, 401, 500) được ném lên: im lặng trả `[]` sẽ biến một bài
      // giảng CÓ video thành bài "reading" trắng, không cách nào nhận ra.
      Promise.all(
        allLessonIds.map((lessonId) =>
          serverApi
            .get<{ contents: ApiLessonContent[] }>(`/lessons/${lessonId}/contents`)
            .then((res) => ({ lessonId, contents: res.contents || [] }))
            .catch((err: unknown) => {
              if (err instanceof HttpError && err.status === 404) {
                return { lessonId, contents: [] };
              }
              throw err;
            })
        )
      ),
      // Fetch all quizzes in parallel.
      //
      // CẢNH BÁO — backend CHƯA có route `GET /lessons/:lessonId/quizzes`:
      // `backend/internal/router/quiz_router.go` chỉ mount `/quizzes/*`,
      // `/attempts/*`, `/me/quizzes`; `course_router.go` dưới `/lessons` chỉ có
      // `/:id` và `/:lesson_id/contents`. Nên hôm nay MỌI bài học đều nhận 404
      // ("route không tồn tại"), và quiz luôn rỗng — không phải vì bài không có
      // quiz. Hệ quả: mỗi lần mở curriculum bắn N request 404 (N = số bài).
      //
      // Cần một task backend bổ sung route này (nên trả `200 []` khi bài không
      // có quiz, thay vì để 404) rồi nối lại phần đọc `quizzes` bên dưới. Khi đó
      // nhánh `quizzes.length > 0` mới thực sự chạy.
      Promise.all(
        allLessonIds.map((lessonId) =>
          serverApi
            .get<{ quizzes: ApiQuiz[] }>(`/lessons/${lessonId}/quizzes`)
            .then((res) => ({ lessonId, quizzes: res.quizzes || [] }))
            .catch((err: unknown) => {
              if (err instanceof HttpError && err.status === 404) {
                return { lessonId, quizzes: [] };
              }
              throw err;
            })
        )
      ),
    ]);

    // Create lookup maps
    const contentsByLessonId = new Map(
      allContentsResults.map((r) => [r.lessonId, r.contents])
    );
    const quizzesByLessonId = new Map(
      allQuizzesResults.map((r) => [r.lessonId, r.quizzes])
    );

    // 5. Build final structure
    const sectionsWithLessons = sections.map((section) => {
      const lessons = lessonsBySectionId.get(section.id) || [];

      const lessonsWithContent = lessons.map((lesson) => {
        const contents = contentsByLessonId.get(lesson.id) || [];
        const quizzes = quizzesByLessonId.get(lesson.id) || [];

        // Determine lesson type
        let type: "video" | "quiz" | "exercise" | "reading" = "reading";
        let quiz_id: string | undefined;
        let exercise_id: string | undefined;
        let video_url: string | undefined;

        if (contents.length > 0) {
          const firstContent = contents[0];
          if (firstContent.type === "video") {
            type = "video";
            video_url = firstContent.video_hls_url || firstContent.video_url;
          } else if (firstContent.type === "exercise") {
            type = "exercise";
            exercise_id = firstContent.exercise_id;
          }
        }

        if (quizzes.length > 0) {
          type = "quiz";
          quiz_id = quizzes[0].id;
        }

        return {
          ...lesson,
          contents,
          type,
          quiz_id,
          exercise_id,
          video_url,
        };
      });

      return {
        ...section,
        lessons: lessonsWithContent,
      };
    });

    return {
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug ?? courseSlug,
        instructor_name: course.instructor?.name,
      },
      sections: sectionsWithLessons,
    };
  } catch (error) {
    // 404 = khóa học không tồn tại (sai slug, đã xoá) → trang not-found, đúng
    // như trước. Mọi lỗi khác (backend 500, 401, mất mạng) được ném tiếp lên
    // error boundary của Next: biến chúng thành `null` sẽ hiển thị trang
    // "không tìm thấy khóa học" cho một sự cố hạ tầng — người học tưởng khóa
    // học đã bị xoá.
    if (error instanceof HttpError && error.status === 404) {
      return null;
    }
    console.error("Failed to fetch curriculum:", error);
    throw error;
  }
}
