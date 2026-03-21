"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  CheckCircle,
  PlayCircle,
  Play,
  HelpCircle,
  Code,
  FileText,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PlayerChapter, PlayerLesson } from "@/lib/mock-data/course-player";

interface PlayerLessonSidebarProps {
  chapters: PlayerChapter[];
  currentLessonId: string;
  courseSlug: string;
  className?: string;
}

function getLessonIcon(lesson: PlayerLesson, isCurrent: boolean) {
  if (lesson.locked) return <Lock className="h-4 w-4 text-gray-500 shrink-0" />;
  if (lesson.completed) return <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />;
  if (isCurrent) return <PlayCircle className="h-4 w-4 text-primary-500 shrink-0" />;

  switch (lesson.type) {
    case "video":
      return <Play className="h-4 w-4 text-gray-400 shrink-0" />;
    case "quiz":
      return <HelpCircle className="h-4 w-4 text-gray-400 shrink-0" />;
    case "exercise":
      return <Code className="h-4 w-4 text-gray-400 shrink-0" />;
    case "reading":
      return <FileText className="h-4 w-4 text-gray-400 shrink-0" />;
    default:
      return <Play className="h-4 w-4 text-gray-400 shrink-0" />;
  }
}

/** Right sidebar showing chapter/lesson tree with progress indicators */
export function PlayerLessonSidebar({
  chapters,
  currentLessonId,
  courseSlug,
  className,
}: PlayerLessonSidebarProps) {
  // Find chapter containing current lesson for default expanded state
  const currentChapterId = chapters.find((ch) =>
    ch.lessons.some((l) => l.id === currentLessonId)
  )?.id;

  const [expandedChapters, setExpandedChapters] = useState<string[]>(
    currentChapterId ? [currentChapterId] : []
  );

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) =>
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  const totalLessons = chapters.reduce((acc, ch) => acc + ch.lessons.length, 0);
  const completedLessons = chapters.reduce(
    (acc, ch) => acc + ch.lessons.filter((l) => l.completed).length,
    0
  );
  const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <aside
      className={cn(
        "w-80 bg-gray-900 text-white overflow-y-auto shrink-0 flex flex-col",
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700 shrink-0">
        <h2 className="font-semibold text-sm">Lộ trình học tập</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          {completedLessons}/{totalLessons} bài hoàn thành
        </p>
        {/* Progress bar */}
        <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">{progressPct}%</p>
      </div>

      {/* Chapter list */}
      <div className="flex-1 py-2">
        {chapters.map((chapter, idx) => {
          const isExpanded = expandedChapters.includes(chapter.id);
          const chapterCompleted = chapter.lessons.filter((l) => l.completed).length;

          return (
            <div key={chapter.id}>
              {/* Chapter toggle button */}
              <button
                onClick={() => toggleChapter(chapter.id)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 shrink-0 text-gray-400 transition-transform",
                      isExpanded && "rotate-90"
                    )}
                  />
                  <span className="text-sm font-medium text-gray-200 truncate">
                    Chương {idx + 1}: {chapter.title}
                  </span>
                </div>
                <span className="text-xs text-gray-500 ml-2 shrink-0">
                  {chapterCompleted}/{chapter.lessons.length}
                </span>
              </button>

              {/* Lessons */}
              {isExpanded && (
                <div className="bg-gray-800/50">
                  {chapter.lessons.map((lesson) => {
                    const isCurrent = lesson.id === currentLessonId;

                    if (lesson.locked) {
                      return (
                        <div
                          key={lesson.id}
                          className="px-4 py-2.5 flex items-center gap-3 opacity-50 cursor-not-allowed"
                        >
                          {getLessonIcon(lesson, false)}
                          <span className="text-sm text-gray-400 flex-1 line-clamp-1">
                            {lesson.title}
                          </span>
                          <span className="text-xs text-gray-500 shrink-0">{lesson.duration}</span>
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={lesson.id}
                        href={`/learn/${courseSlug}/${lesson.id}`}
                        className={cn(
                          "px-4 py-2.5 flex items-center gap-3 text-sm transition-colors",
                          isCurrent
                            ? "bg-primary-900/50 border-l-2 border-primary-500 text-primary-300"
                            : "hover:bg-gray-700/50 text-gray-300"
                        )}
                      >
                        {getLessonIcon(lesson, isCurrent)}
                        <span className="flex-1 line-clamp-1">{lesson.title}</span>
                        <span className="text-xs text-gray-500 shrink-0">{lesson.duration}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
