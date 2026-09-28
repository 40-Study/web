"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { Download, ExternalLink, FileText, Link as LinkIcon, ClipboardCheck, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useCourseReviews } from "@/hooks/queries/use-reviews";
import type { PlayerCourse, PlayerResource } from "@/types/course-player";
import type { Quiz } from "@/services/quiz.service";
import { LessonReviewsPanel } from "./lesson-reviews-panel";

interface PlayerTabsProps {
  course: PlayerCourse;
  /**
   * Quiz gắn với bài đang học (`GET /lessons/:id/quizzes`) — A3, QA vòng 2
   * (N16). Trước đây trang không truyền gì vào đây nên tab Quiz luôn "chưa có
   * câu hỏi" kể cả khi bài có quiz thật.
   */
  lessonQuizzes?: Quiz[];
}

// A5 (QA vòng 2, N7): bỏ tab "Hỏi & Đáp" giữ chỗ ("sẽ sớm ra mắt") — trang học
// đã có panel Hỏi đáp THẬT trong thanh công cụ học tập (LessonStudyTools).
type TabKey = "overview" | "resources" | "quiz" | "reviews";

function ResourceIcon({ type }: { type: PlayerResource["type"] }) {
  switch (type) {
    case "pdf":
      return <FileText className="w-5 h-5 text-red-500" />;
    case "zip":
      return <Download className="w-5 h-5 text-blue-500" />;
    case "link":
      return <LinkIcon className="w-5 h-5 text-green-500" />;
  }
}

export interface PlayerTabsHandle {
  switchToExercises: () => void;
}

/** Light-themed tabs below the video */
export const PlayerTabs = forwardRef<PlayerTabsHandle, PlayerTabsProps>(
  function PlayerTabs({ course, lessonQuizzes = [] }, ref) {
    const [activeTab, setActiveTab] = useState<TabKey>("overview");
    // Số đánh giá THẬT (A5) — cùng query key với LessonReviewsPanel nên chỉ gọi API một lần.
    const reviewsQuery = useCourseReviews(course.id);
    const reviewTotal = reviewsQuery.data?.total;

    useImperativeHandle(ref, () => ({
      switchToExercises: () => setActiveTab("quiz"),
    }));

    const tabs: { key: TabKey; label: string }[] = [
      { key: "overview", label: "Tổng quan" },
      { key: "resources", label: "Tài liệu học tập" },
      { key: "quiz", label: lessonQuizzes.length > 0 ? `Quiz (${lessonQuizzes.length})` : "Quiz" },
      { key: "reviews", label: reviewTotal !== undefined ? `Đánh giá (${reviewTotal})` : "Đánh giá" },
    ];

    return (
      <div className="mt-4">
        {/* Tab navigation — cuộn ngang trên mobile (S-P1-5): 5 tab (kể cả nhãn
            dài "Đánh giá (N)"/"Hỏi & Đáp") vỡ chữ dọc ở 390px nếu để flex co lại. */}
        <div className="flex gap-0 overflow-x-auto whitespace-nowrap border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "shrink-0 px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
                activeTab === tab.key
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="py-5">
          {activeTab === "overview" && (
            <div className="space-y-5">
              <p className="text-sm text-gray-600 leading-relaxed">{course.description}</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Trình độ</p>
                  <p className="text-sm font-medium text-gray-900">{course.level}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Ngôn ngữ</p>
                  <p className="text-sm font-medium text-gray-900">{course.language}</p>
                </div>
              </div>

              {/* Instructor */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Giảng viên</h3>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                    <span className="text-primary-600 font-semibold text-lg">
                      {course.instructor.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{course.instructor.name}</p>
                    <p className="text-sm text-gray-500">{course.instructor.title}</p>
                    {/* A8: API khoá học không trả rating/số học viên/số khoá của giảng
                        viên — trước đây hiện "0 ★ · 0 học viên · 0 khóa học". Chỉ hiện số có thật. */}
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                      {course.instructor.rating > 0 && <span>{course.instructor.rating} ★</span>}
                      {course.instructor.studentCount > 0 && (
                        <span>{course.instructor.studentCount.toLocaleString("vi-VN")} học viên</span>
                      )}
                      {course.instructor.courseCount > 0 && <span>{course.instructor.courseCount} khóa học</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "quiz" && (
            <div className="space-y-2">
              {lessonQuizzes.length === 0 ? (
                <p className="text-sm text-gray-500 py-4">Bài học này chưa có bài kiểm tra.</p>
              ) : (
                lessonQuizzes.map((quiz) => (
                  <Link
                    key={quiz.id}
                    href={`/quizzes/${quiz.id}`}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    <ClipboardCheck className="w-5 h-5 text-primary-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 break-words">{quiz.title}</p>
                      <p className="text-xs text-gray-500">
                        {[
                          quiz.time_limit_minutes ? `${quiz.time_limit_minutes} phút` : null,
                          quiz.max_attempts ? `Tối đa ${quiz.max_attempts} lần làm` : null,
                          quiz.pass_percentage ? `Đạt từ ${Math.round(Number(quiz.pass_percentage))}%` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "Bài kiểm tra"}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-primary-600 shrink-0 flex items-center">
                      Làm bài
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </Link>
                ))
              )}
            </div>
          )}

          {activeTab === "resources" && (
            <div className="space-y-3">
              {course.resources.length === 0 ? (
                <p className="text-sm text-gray-500">Chưa có tài liệu học tập.</p>
              ) : (
                course.resources.map((resource) => (
                  <a
                    key={resource.id}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors group"
                  >
                    <ResourceIcon type={resource.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{resource.title}</p>
                      {resource.size && (
                        <p className="text-xs text-gray-500">{resource.size}</p>
                      )}
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-primary-500 shrink-0" />
                  </a>
                ))
              )}
            </div>
          )}

          {activeTab === "reviews" && (
            <LessonReviewsPanel
              courseId={course.id}
              data={reviewsQuery.data}
              isLoading={reviewsQuery.isLoading}
              isError={reviewsQuery.isError}
            />
          )}
        </div>
      </div>
    );
  }
);
