"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQueries } from "@tanstack/react-query";
import {
  ChevronLeft,
  Code2,
  ListChecks,
  Lock,
  Clock,
  CheckCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCourseBySlug } from "@/hooks/queries/use-courses";
import { useSections } from "@/hooks/queries/use-sections";
import { lessonContentKeys } from "@/hooks/queries/use-lesson-content";
import { quizKeys } from "@/hooks/queries/use-quiz";
import { lessonContentService, type LessonContent } from "@/services/lesson-content.service";
import { quizService, type Quiz, type QuizAttempt } from "@/services/quiz.service";
import { courseTaskHref, mapSectionsToExercises } from "@/lib/course-exercises";
import type { Section } from "@/types/section";

const KIND_BADGE = {
  exercise: { label: "Bài tập code", icon: Code2, iconBg: "bg-blue-100", iconFg: "text-blue-600", badge: "bg-blue-100 text-blue-700" },
  quiz: { label: "Trắc nghiệm", icon: ListChecks, iconBg: "bg-purple-100", iconFg: "text-purple-600", badge: "bg-purple-100 text-purple-700" },
} as const;

export default function CourseExercisesPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: course, isLoading: courseLoading } = useCourseBySlug(slug);
  const { data: rawSections = [], isLoading: sectionsLoading } = useSections(course?.id ?? "");
  // GET /courses/:id/sections có kèm `lessons`, nhưng type của section.service chưa khai báo.
  const sections: Section[] = rawSections;

  // Sections không mang loại nội dung → lấy content từng bài để biết bài nào là bài tập.
  // Dùng chung query key với useLessonContents nên trang học tái dùng cache.
  const lessonIds = sections.flatMap((s) => (s.lessons ?? []).map((l) => l.id));
  const contentQueries = useQueries({
    queries: lessonIds.map((id) => ({
      queryKey: lessonContentKeys.contents(id),
      queryFn: () => lessonContentService.getContents(id),
      staleTime: 30 * 1000,
    })),
  });

  const contentsByLesson: Record<string, LessonContent[] | undefined> = {};
  lessonIds.forEach((id, i) => {
    contentsByLesson[id] = contentQueries[i]?.data;
  });

  // Quiz không nằm trong lesson_contents → hỏi `GET /lessons/:id/quizzes` cho từng bài của
  // khoá (số request bị chặn bởi số bài). Cùng query key với useQuizzesByLesson của trang học.
  const quizQueries = useQueries({
    queries: lessonIds.map((id) => ({
      queryKey: quizKeys.byLesson(id),
      queryFn: () => quizService.getByLesson(id),
      staleTime: 30 * 1000,
    })),
  });
  const quizzesByLesson: Record<string, Quiz[] | undefined> = {};
  lessonIds.forEach((id, i) => {
    quizzesByLesson[id] = quizQueries[i]?.data;
  });
  const failedQuizLessons = quizQueries.filter((q) => q.isError).length;

  // Lượt làm chỉ hỏi cho quiz thật sự tồn tại, để biết quiz nào đã ĐẠT.
  const quizIds = Object.values(quizzesByLesson).flatMap((qs) => (qs ?? []).map((q) => q.id));
  const attemptQueries = useQueries({
    queries: quizIds.map((id) => ({
      queryKey: quizKeys.attempts(id),
      queryFn: () => quizService.getMyAttempts(id),
      staleTime: 30 * 1000,
    })),
  });
  const attemptsByQuiz: Record<string, QuizAttempt[] | undefined> = {};
  quizIds.forEach((id, i) => {
    attemptsByQuiz[id] = attemptQueries[i]?.data;
  });

  const isLoading =
    courseLoading ||
    sectionsLoading ||
    contentQueries.some((q) => q.isLoading) ||
    quizQueries.some((q) => q.isLoading) ||
    attemptQueries.some((q) => q.isLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const exercises = mapSectionsToExercises(
    sections,
    contentsByLesson,
    quizzesByLesson,
    attemptsByQuiz
  );
  const completedCount = exercises.filter((e) => e.completed).length;
  const pendingCount = exercises.filter((e) => !e.completed && !e.locked).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Back link */}
        <Link
          href={`/courses/${slug}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Quay lại khóa học
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Bài tập & Kiểm tra</h1>
          <p className="text-gray-500 mt-1">{course?.title ?? ""}</p>
          <div className="flex items-center gap-4 mt-3 text-sm">
            <span className="text-green-600">{completedCount} hoàn thành</span>
            <span className="text-orange-600">{pendingCount} chưa làm</span>
            <span className="text-gray-400">{exercises.length} tổng cộng</span>
          </div>
        </div>

        {failedQuizLessons > 0 && (
          <p className="mb-4 flex items-center gap-2 text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Không tải được trắc nghiệm của {failedQuizLessons} bài học, danh sách có thể thiếu.
          </p>
        )}

        {/* Exercise cards */}
        <div className="space-y-3">
          {exercises.length === 0 ? (
            <p className="text-gray-500 text-center py-10">Khóa học chưa có bài tập nào.</p>
          ) : (
            exercises.map((ex) => {
              const kind = KIND_BADGE[ex.kind];
              const KindIcon = kind.icon;
              const href = courseTaskHref(slug, ex);
              return (
              <div
                key={ex.id}
                className={cn(
                  "bg-white rounded-xl border p-4 transition-all",
                  ex.locked
                    ? "border-gray-200 opacity-60"
                    : ex.completed
                    ? "border-green-200 hover:border-green-300"
                    : "border-gray-200 hover:border-primary-300 hover:shadow-sm"
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", kind.iconBg)}>
                    <KindIcon className={cn("w-6 h-6", kind.iconFg)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{ex.title}</p>
                    <p className="text-sm text-gray-500">
                      Chương {ex.chapterIndex}: {ex.chapterTitle}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                      <span className={cn("px-2 py-0.5 rounded-full font-medium", kind.badge)}>
                        {kind.label}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {ex.duration}
                      </span>
                    </div>
                  </div>

                  {/* Status + Action */}
                  <div className="shrink-0 text-right">
                    {ex.locked ? (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Lock className="w-4 h-4" />
                        <span className="text-sm">Khóa</span>
                      </div>
                    ) : ex.completed ? (
                      <div className="flex flex-col items-end gap-2">
                        <span className="flex items-center gap-1 text-green-600 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          Hoàn thành
                        </span>
                        <Link
                          href={href}
                          className="text-sm text-primary-600 hover:underline"
                        >
                          Xem lại
                        </Link>
                      </div>
                    ) : (
                      <Link
                        href={href}
                        className="inline-flex px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Làm bài
                      </Link>
                    )}
                  </div>
                </div>
              </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
