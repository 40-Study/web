"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQueries } from "@tanstack/react-query";
import { ChevronLeft, Code2, Lock, Clock, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCourseBySlug } from "@/hooks/queries/use-courses";
import { useSections } from "@/hooks/queries/use-sections";
import { lessonContentKeys } from "@/hooks/queries/use-lesson-content";
import { lessonContentService, type LessonContent } from "@/services/lesson-content.service";
import { mapSectionsToExercises } from "@/lib/course-exercises";
import type { Section } from "@/types/section";

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

  const isLoading =
    courseLoading || sectionsLoading || contentQueries.some((q) => q.isLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const exercises = mapSectionsToExercises(sections, contentsByLesson);
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

        {/* Exercise cards */}
        <div className="space-y-3">
          {exercises.length === 0 ? (
            <p className="text-gray-500 text-center py-10">Khóa học chưa có bài tập nào.</p>
          ) : (
            exercises.map((ex) => (
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
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-blue-100">
                    <Code2 className="w-6 h-6 text-blue-600" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{ex.title}</p>
                    <p className="text-sm text-gray-500">
                      Chương {ex.chapterIndex}: {ex.chapterTitle}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                      <span className="px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
                        Thực hành
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
                          href={`/learn/${slug}/${ex.id}`}
                          className="text-sm text-primary-600 hover:underline"
                        >
                          Xem lại
                        </Link>
                      </div>
                    ) : (
                      <Link
                        href={`/learn/${slug}/${ex.id}`}
                        className="inline-flex px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Làm bài
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
