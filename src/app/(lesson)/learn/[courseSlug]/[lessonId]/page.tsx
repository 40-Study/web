"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { VideoPlayer } from "@/components/lesson/video-player";
import {
  PlayerHeader,
  PlayerLessonSidebar,
  PlayerTabs,
  FloatingButtons,
  CodeEditorModal,
} from "@/components/player";
import {
  mockPlayerCourse,
  getLessonById,
  getAdjacentLessons,
} from "@/lib/mock-data/course-player";

export default function CourseLessonPage() {
  const params = useParams<{ courseSlug: string; lessonId: string }>();
  const { courseSlug, lessonId } = params;

  const [isCodeEditorOpen, setCodeEditorOpen] = useState(false);

  // Resolve lesson from mock data (replace with API call in production)
  const course = mockPlayerCourse;
  const currentLesson = getLessonById(course, lessonId);
  const { prev, next } = getAdjacentLessons(course, lessonId);

  // Fallback video URL for lessons without a specific URL
  const videoSrc =
    currentLesson?.videoUrl ??
    "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      {/* Minimal player header */}
      <PlayerHeader courseTitle={course.title} />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: video + info + tabs */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Video player — full-width dark background */}
          <div className="bg-black">
            <div className="max-w-5xl mx-auto w-full">
              <VideoPlayer
                src={videoSrc}
                className="rounded-none"
              />
            </div>
          </div>

          {/* Lesson title + prev/next navigation */}
          <div className="max-w-5xl mx-auto w-full px-6 pt-5 pb-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-lg font-semibold text-white">
                  {currentLesson?.title ?? "Đang tải bài học..."}
                </h1>
                {currentLesson && (
                  <p className="text-sm text-gray-400 mt-0.5">
                    {currentLesson.type === "video" && "Video bài giảng"}
                    {currentLesson.type === "quiz" && "Bài kiểm tra"}
                    {currentLesson.type === "exercise" && "Bài tập thực hành"}
                    {currentLesson.type === "reading" && "Tài liệu đọc"}
                    {" · "}{currentLesson.duration}
                  </p>
                )}
              </div>

              {/* Prev / Next buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {prev ? (
                  <Link
                    href={`/learn/${courseSlug}/${prev.id}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Trước
                  </Link>
                ) : (
                  <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-800/50 text-gray-600 text-sm cursor-not-allowed">
                    <ChevronLeft className="w-4 h-4" />
                    Trước
                  </span>
                )}

                {next ? (
                  <Link
                    href={`/learn/${courseSlug}/${next.id}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors text-sm"
                  >
                    Tiếp
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-800/50 text-gray-600 text-sm cursor-not-allowed">
                    Tiếp
                    <ChevronRight className="w-4 h-4" />
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tabs: Overview, Resources, Reviews */}
          <div className="max-w-5xl mx-auto w-full px-6 pb-24">
            <PlayerTabs course={course} />
          </div>
        </div>

        {/* Right: lesson/chapter tree sidebar */}
        <PlayerLessonSidebar
          chapters={course.chapters}
          currentLessonId={lessonId}
          courseSlug={courseSlug}
        />
      </div>

      {/* Floating AI Assistant + Sandbox buttons */}
      <FloatingButtons onSandboxOpen={() => setCodeEditorOpen(true)} />

      {/* Code editor modal (lazy-loaded) */}
      {isCodeEditorOpen && (
        <CodeEditorModal onClose={() => setCodeEditorOpen(false)} />
      )}
    </div>
  );
}
