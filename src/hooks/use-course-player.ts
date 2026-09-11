"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { courseService } from "@/services/course.service";
import { sectionService, Section } from "@/services/section.service";
import { lessonService, Lesson } from "@/services/lesson.service";
import { lessonContentService, LessonContent } from "@/services/lesson-content.service";
import { quizService, StartQuizResponse, QuizAttemptDetail, SubmitQuizDTO } from "@/services/quiz.service";
import { exerciseService, Exercise, TestCase, ExerciseSubmission } from "@/services/exercise.service";
import { enrollmentService } from "@/services/enrollment.service";
import { videoService, VideoInfo } from "@/services/video.service";
import { NotFoundError } from "@/lib/errors";
import type { PlayerCourse, PlayerChapter, PlayerLesson } from "@/types/course-player";

// ─── Types ──────────────────────────────────────────────────────────────────

// Simplified content type for player (doesn't need all service fields)
export interface PlayerLessonContent {
  id: string;
  type: string;
  video_url?: string;
  video_hls_url?: string;
  exercise_id?: string;
}

// Standalone types to avoid tight coupling with service types
export interface LessonWithContent {
  id: string;
  title: string;
  description?: string;
  duration_minutes?: number;
  position?: number;
  contents: PlayerLessonContent[];
  type: "video" | "quiz" | "exercise" | "reading";
  quiz_id?: string;
  exercise_id?: string;
  video_url?: string;
}

export interface SectionWithLessons {
  id: string;
  title: string;
  description?: string;
  course_id?: string;
  display_order?: number;
  lessons: LessonWithContent[];
}

export interface PlayerCurriculum {
  course: {
    id: string;
    title: string;
    slug: string;
    instructor_name?: string;
  };
  sections: SectionWithLessons[];
}

// ─── Query Keys ─────────────────────────────────────────────────────────────

export const playerKeys = {
  curriculum: (courseSlug: string) => ["player", "curriculum", courseSlug] as const,
  lessonContent: (lessonId: string) => ["player", "lesson-content", lessonId] as const,
  quiz: (quizId: string) => ["player", "quiz", quizId] as const,
  quizAttempt: (quizId: string, attemptId: string) => ["player", "quiz-attempt", quizId, attemptId] as const,
  exercise: (exerciseId: string) => ["player", "exercise", exerciseId] as const,
  video: (videoId: string) => ["player", "video", videoId] as const,
};

// ─── Curriculum Hook ────────────────────────────────────────────────────────

/** Fetch full course curriculum for player (sections + lessons + content types) */
export function useCourseCurriculum(courseSlug: string) {
  return useQuery({
    queryKey: playerKeys.curriculum(courseSlug),
    queryFn: async (): Promise<PlayerCurriculum> => {
      // 1. Get course by slug
      const course = await courseService.getCourseBySlug(courseSlug);

      // 2. Get all sections
      const sections = await sectionService.getSections(course.id);

      // 3. Fetch all lessons for ALL sections in parallel (avoid waterfall)
      const allLessonsPromises = sections.map((section) =>
        lessonService.getLessons(section.id).then((lessons) => ({
          sectionId: section.id,
          lessons,
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

      // Fetch all contents and quizzes in parallel (not sequentially per lesson)
      const [allContentsResults, allQuizzesResults] = await Promise.all([
        // Fetch all lesson contents in parallel
        Promise.all(
          allLessonIds.map((lessonId) =>
            lessonContentService.getContents(lessonId).then((contents) => ({
              lessonId,
              contents,
            }))
          )
        ),
        // Bài học không có quiz là chuyện bình thường (API trả 404) — coi như danh sách rỗng.
        // Mọi lỗi KHÁC (mất mạng, 500, hết phiên) được ném lên để <QueryState> báo cho người
        // dùng; trước đây catch trống nuốt hết, quiz biến mất im lặng trông như bài không có quiz.
        Promise.all(
          allLessonIds.map((lessonId) =>
            quizService
              .getByLesson(lessonId)
              .then((quizzes) => ({ lessonId, quizzes }))
              .catch((err: unknown) => {
                if (err instanceof NotFoundError) return { lessonId, quizzes: [] };
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

      // 5. Build final structure using maps (no more async calls)
      const sectionsWithLessons: SectionWithLessons[] = sections.map((section) => {
        const lessons = lessonsBySectionId.get(section.id) || [];

        const lessonsWithContent: LessonWithContent[] = lessons.map((lesson) => {
          const contents = contentsByLessonId.get(lesson.id) || [];
          const quizzes = quizzesByLessonId.get(lesson.id) || [];

          // Determine lesson type based on content
          let type: LessonWithContent["type"] = "reading";
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

          // Check if lesson has quiz
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
    },
    enabled: !!courseSlug,
    staleTime: 5 * 60 * 1000,
  });
}

/** Convert curriculum to PlayerCourse format for existing components */
export function curriculumToPlayerCourse(
  curriculum: PlayerCurriculum,
  completions?: Set<string>
): PlayerCourse {
  return {
    id: curriculum.course.id,
    title: curriculum.course.title,
    slug: curriculum.course.slug,
    description: "",
    instructor: {
      name: curriculum.course.instructor_name ?? "Giảng viên",
      title: "",
      rating: 0,
      studentCount: 0,
      courseCount: 0,
    },
    rating: 0,
    reviewCount: 0,
    level: "beginner",
    language: "Tiếng Việt",
    chapters: curriculum.sections.map((section): PlayerChapter => ({
      id: section.id,
      title: section.title,
      lessons: section.lessons.map((lesson): PlayerLesson => ({
        id: lesson.id,
        title: lesson.title,
        duration: lesson.duration_minutes ? `${lesson.duration_minutes}:00` : "00:00",
        type: lesson.type,
        // Use optimistic completion state from local cache
        completed: completions?.has(lesson.id) || false,
        locked: false,
        videoUrl: lesson.video_url,
      })),
    })),
    resources: [],
    reviews: [],
  };
}

// ─── Quiz Hooks ─────────────────────────────────────────────────────────────

/** Start a quiz attempt */
export function useStartQuiz() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (quizId: string) => quizService.startQuiz(quizId),
    onSuccess: (data) => {
      qc.setQueryData(playerKeys.quiz(data.quiz_id), data);
    },
    onError: () => {
      toast.error("Không thể bắt đầu bài quiz");
    },
  });
}

/** Submit quiz answers */
export function useSubmitQuiz() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ quizId, data }: { quizId: string; data: SubmitQuizDTO }) =>
      quizService.submitQuiz(quizId, data),
    onSuccess: (result, { quizId }) => {
      qc.invalidateQueries({ queryKey: playerKeys.quiz(quizId) });
      if (result.is_passed) {
        toast.success("Chúc mừng! Bạn đã hoàn thành bài quiz");
      } else {
        toast.info("Bạn chưa đạt điểm yêu cầu. Hãy thử lại!");
      }
    },
    onError: () => {
      toast.error("Không thể nộp bài quiz");
    },
  });
}

/** Get quiz attempt detail (results) */
export function useQuizAttemptDetail(quizId: string, attemptId: string) {
  return useQuery({
    queryKey: playerKeys.quizAttempt(quizId, attemptId),
    queryFn: () => quizService.getAttemptDetail(quizId, attemptId),
    enabled: !!quizId && !!attemptId,
  });
}

// ─── Exercise Hooks ─────────────────────────────────────────────────────────

/** Fetch exercise with test cases */
export function useExercise(exerciseId: string) {
  return useQuery({
    queryKey: playerKeys.exercise(exerciseId),
    queryFn: async () => {
      const [exercise, testCases] = await Promise.all([
        exerciseService.getById(exerciseId),
        exerciseService.getTestCases(exerciseId),
      ]);
      return { exercise, testCases };
    },
    enabled: !!exerciseId,
    staleTime: 5 * 60 * 1000,
  });
}

/** Submit exercise code */
export function useSubmitExercise() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      exerciseId,
      code,
      language,
    }: {
      exerciseId: string;
      code: string;
      language: string;
    }) => exerciseService.submit(exerciseId, { code, language }),
    onSuccess: (result, { exerciseId }) => {
      qc.invalidateQueries({ queryKey: playerKeys.exercise(exerciseId) });
      if (result.status === "accepted") {
        toast.success("Accepted! Bài làm của bạn đã đúng");
      } else {
        toast.error("Sai kết quả. Hãy kiểm tra lại code!");
      }
    },
    onError: () => {
      toast.error("Không thể nộp bài");
    },
  });
}

// ─── Video & Progress Hooks ─────────────────────────────────────────────────

/** Get video info */
export function useVideo(videoId: string) {
  return useQuery({
    queryKey: playerKeys.video(videoId),
    queryFn: () => videoService.getVideo(videoId),
    enabled: !!videoId,
    staleTime: 10 * 60 * 1000,
  });
}

/** Update lesson progress with optimistic UI */
export function useUpdateProgress(courseSlug?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      lessonId,
      status,
      videoWatchedSeconds,
    }: {
      lessonId: string;
      status: string;
      videoWatchedSeconds?: number;
    }) =>
      enrollmentService.updateProgress(lessonId, {
        status,
        video_watched_seconds: videoWatchedSeconds,
      }),

    // Optimistic update - immediately show completion in UI
    onMutate: async (variables) => {
      if (variables.status !== "completed" || !courseSlug) {
        return;
      }

      // Cancel any outgoing refetches to prevent overwriting optimistic update
      await qc.cancelQueries({ queryKey: ["player", "curriculum", courseSlug] });

      // Snapshot previous value for rollback
      const previousCurriculum = qc.getQueryData<PlayerCurriculum>(
        playerKeys.curriculum(courseSlug)
      );

      // Optimistically update lesson completion
      if (previousCurriculum) {
        const optimisticData: PlayerCurriculum = {
          ...previousCurriculum,
          sections: previousCurriculum.sections.map((section) => ({
            ...section,
            lessons: section.lessons.map((lesson) =>
              lesson.id === variables.lessonId
                ? { ...lesson, completed: true }
                : lesson
            ),
          })),
        };

        qc.setQueryData(playerKeys.curriculum(courseSlug), optimisticData);

        // Update local completion state for immediate sidebar feedback
        qc.setQueryData(
          ["player", "completions", courseSlug],
          (old: Set<string> | undefined) => {
            const newSet = new Set(old || []);
            newSet.add(variables.lessonId);
            return newSet;
          }
        );
      }

      return { previousCurriculum };
    },

    // Rollback on error
    onError: (err, variables, context) => {
      if (context?.previousCurriculum && courseSlug) {
        qc.setQueryData(
          playerKeys.curriculum(courseSlug),
          context.previousCurriculum
        );

        // Remove from local completions
        qc.setQueryData(
          ["player", "completions", courseSlug],
          (old: Set<string> | undefined) => {
            const newSet = new Set(old || []);
            newSet.delete(variables.lessonId);
            return newSet;
          }
        );

        toast.error("Không thể cập nhật tiến độ. Vui lòng thử lại.");
      }
    },

    // Always sync with server after mutation settles
    onSettled: () => {
      if (courseSlug) {
        qc.invalidateQueries({ queryKey: ["player", "curriculum", courseSlug] });
      }
    },
  });
}

/** Hook to get optimistic completion state */
export function useLessonCompletions(courseSlug: string) {
  const qc = useQueryClient();
  const completions = qc.getQueryData<Set<string>>(["player", "completions", courseSlug]);
  return completions || new Set<string>();
}
