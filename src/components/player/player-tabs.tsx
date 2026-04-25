"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { Star, Download, ExternalLink, FileText, Link as LinkIcon, Code2, HelpCircle, Lock, Clock, Check, X, Circle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { PlayerCourse, PlayerResource, VideoQuiz } from "@/types/course-player";

interface PlayerTabsProps {
  course: PlayerCourse;
  courseSlug: string;
  reviewCount?: number;
  videoQuizzes?: VideoQuiz[];
  currentVideoTime?: number;
  onQuizClick?: (quiz: VideoQuiz) => void;
}

type TabKey = "overview" | "resources" | "quiz" | "reviews" | "qna";

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

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "w-4 h-4",
            star <= Math.round(rating)
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-300"
          )}
        />
      ))}
    </div>
  );
}

export interface PlayerTabsHandle {
  switchToExercises: () => void;
}

/** Light-themed tabs below the video */
export const PlayerTabs = forwardRef<PlayerTabsHandle, PlayerTabsProps>(
  function PlayerTabs({ course, courseSlug, reviewCount, videoQuizzes = [], currentVideoTime = 0, onQuizClick }, ref) {
    const [activeTab, setActiveTab] = useState<TabKey>("overview");

    useImperativeHandle(ref, () => ({
      switchToExercises: () => setActiveTab("quiz"),
    }));

    const tabs: { key: TabKey; label: string }[] = [
      { key: "overview", label: "Tổng quan" },
      { key: "resources", label: "Tài liệu học tập" },
      { key: "quiz", label: "Quiz" },
      { key: "reviews", label: `Đánh giá (${reviewCount ?? course.reviewCount})` },
      { key: "qna", label: "Hỏi & Đáp" },
    ];

    const formatTimestamp = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const getQuizStatusIcon = (quiz: VideoQuiz) => {
      switch (quiz.status) {
        case "correct":
          return <Check className="w-5 h-5 text-green-500" />;
        case "incorrect":
          return <X className="w-5 h-5 text-red-500" />;
        case "in_progress":
          return <Circle className="w-5 h-5 text-primary-500 fill-primary-500" />;
        case "locked":
          return <Lock className="w-4 h-4 text-gray-400" />;
        default:
          return <Circle className="w-5 h-5 text-gray-300" />;
      }
    };

    return (
      <div className="mt-4">
        {/* Tab navigation */}
        <div className="flex gap-0 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
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
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{course.instructor.rating} ★</span>
                      <span>{course.instructor.studentCount.toLocaleString()} học viên</span>
                      <span>{course.instructor.courseCount} khóa học</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "quiz" && (
            <div className="space-y-1">
              {videoQuizzes.length === 0 ? (
                <p className="text-sm text-gray-500 py-4">Bài học này chưa có câu hỏi quiz.</p>
              ) : (
                videoQuizzes.map((quiz) => {
                  const isActive = quiz.status === "in_progress";
                  const isLocked = quiz.status === "locked";
                  const isClickable = !isLocked && quiz.status !== "in_progress";

                  return (
                    <button
                      key={quiz.id}
                      onClick={() => isClickable && onQuizClick?.(quiz)}
                      disabled={isLocked}
                      className={cn(
                        "w-full flex items-center gap-4 px-4 py-3 rounded-lg text-left transition-colors",
                        isActive && "bg-primary-50",
                        isLocked ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
                      )}
                    >
                      <div className={cn(
                        "flex items-center gap-1.5 text-sm font-mono shrink-0",
                        isActive ? "text-primary-600" : "text-gray-500"
                      )}>
                        <Clock className="w-4 h-4" />
                        <span>{formatTimestamp(quiz.timestamp)}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium truncate",
                          isActive ? "text-primary-600" : "text-gray-900"
                        )}>
                          {quiz.title}
                          {isActive && (
                            <span className="ml-2 text-primary-500 font-normal">(Đang trả lời...)</span>
                          )}
                        </p>
                        {isActive && (
                          <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-primary-500 rounded-full w-1/2 animate-pulse" />
                          </div>
                        )}
                      </div>

                      <div className="shrink-0">
                        {getQuizStatusIcon(quiz)}
                      </div>
                    </button>
                  );
                })
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
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-4xl font-bold text-gray-900">{course.rating}</p>
                  <StarRating rating={course.rating} />
                  <p className="text-xs text-gray-500 mt-1">{course.reviewCount} đánh giá</p>
                </div>
              </div>
              {course.reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 shrink-0">
                      {review.user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{review.user.name}</p>
                      <div className="flex items-center gap-2">
                        <StarRating rating={review.rating} />
                        <span className="text-xs text-gray-400">{review.createdAt}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{review.content}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === "qna" && (
            <div className="text-center py-10">
              <p className="text-sm text-gray-500">Chức năng Hỏi & Đáp sẽ sớm ra mắt.</p>
            </div>
          )}
        </div>
      </div>
    );
  }
);
