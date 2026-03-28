"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Code2, HelpCircle, Lock, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockPlayerCourse } from "@/lib/mock-data/course-player";

export default function CourseExercisesPage() {
  const { slug } = useParams<{ slug: string }>();
  const course = mockPlayerCourse; // In production, fetch by slug

  // Extract all exercises/quizzes from chapters
  const exercises = course.chapters.flatMap((ch, chIdx) =>
    ch.lessons
      .filter((l) => l.type === "exercise" || l.type === "quiz")
      .map((l) => ({
        ...l,
        chapterTitle: ch.title,
        chapterIndex: chIdx + 1,
      }))
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
          <p className="text-gray-500 mt-1">{course.title}</p>
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
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                      ex.type === "quiz" ? "bg-orange-100" : "bg-blue-100"
                    )}
                  >
                    {ex.type === "quiz" ? (
                      <HelpCircle className="w-6 h-6 text-orange-600" />
                    ) : (
                      <Code2 className="w-6 h-6 text-blue-600" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{ex.title}</p>
                    <p className="text-sm text-gray-500">
                      Chương {ex.chapterIndex}: {ex.chapterTitle}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full font-medium",
                        ex.type === "quiz" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                      )}>
                        {ex.type === "quiz" ? "Trắc nghiệm" : "Thực hành"}
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
