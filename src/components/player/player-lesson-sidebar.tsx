"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronUp,
  ChevronDown,
  CheckCircle,
  PlayCircle,
  Clock,
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

/** Numbered circle icon for each lesson in the sidebar */
function LessonStatusIcon({ lesson, index, isCurrent }: { lesson: PlayerLesson; index: number; isCurrent: boolean }) {
  if (lesson.completed) {
    return (
      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0">
        <CheckCircle className="w-4 h-4 text-white" />
      </div>
    );
  }
  if (isCurrent) {
    return (
      <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center shrink-0">
        <PlayCircle className="w-4 h-4 text-white" />
      </div>
    );
  }
  if (lesson.locked) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
        <span className="text-xs font-medium text-gray-400">{index + 1}</span>
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center shrink-0">
      <span className="text-xs font-medium text-gray-500">{index + 1}</span>
    </div>
  );
}

/** Sub-items under current lesson (quiz, exercise) */
function LessonSubItems({ chapter, currentLessonId }: { chapter: PlayerChapter; currentLessonId: string }) {
  const currentLesson = chapter.lessons.find((l) => l.id === currentLessonId);
  if (!currentLesson) return null;

  // Show quiz/exercise sub-items for the current lesson's chapter context
  const subItems = chapter.lessons.filter(
    (l) => (l.type === "quiz" || l.type === "exercise") && l.id !== currentLessonId
  );
  if (subItems.length === 0) return null;

  return (
    <div className="ml-14 space-y-1.5 pb-2">
      {subItems.map((item) => (
        <div key={item.id} className="flex items-center gap-2 text-xs text-gray-500">
          {item.type === "quiz" ? (
            <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
          ) : (
            <Code className="w-3.5 h-3.5 text-gray-400" />
          )}
          <span>{item.type === "quiz" ? "Quiz" : "Thực hành"}: {item.title.replace(/^(Bài tập:|Quiz:)\s*/, "")}</span>
        </div>
      ))}
    </div>
  );
}

/** Right sidebar — light theme with progress and chapter accordion */
export function PlayerLessonSidebar({
  chapters,
  currentLessonId,
  courseSlug,
  className,
}: PlayerLessonSidebarProps) {
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
        "w-[380px] bg-white border-l border-gray-200 overflow-y-auto shrink-0 flex flex-col",
        className
      )}
    >
      {/* Progress header */}
      <div className="p-5 border-b border-gray-100 shrink-0">
        <h2 className="font-bold text-base text-gray-900">Lộ trình học tập</h2>
        <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500">Tiến độ: {progressPct}%</span>
          <span className="text-xs text-gray-500">
            {completedLessons}/{totalLessons} bài học
          </span>
        </div>
      </div>

      {/* Chapter accordion list */}
      <div className="flex-1">
        {chapters.map((chapter, chIdx) => {
          const isExpanded = expandedChapters.includes(chapter.id);
          const allLocked = chapter.lessons.every((l) => l.locked);

          return (
            <div key={chapter.id} className="border-b border-gray-100 last:border-0">
              {/* Chapter header */}
              <button
                onClick={() => toggleChapter(chapter.id)}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-semibold text-gray-900">
                  Chương {chIdx + 1}: {chapter.title}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {allLocked && <Lock className="w-4 h-4 text-gray-400" />}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Lessons */}
              {isExpanded && (
                <div className="pb-2">
                  {chapter.lessons.map((lesson, lIdx) => {
                    const isCurrent = lesson.id === currentLessonId;

                    const content = (
                      <div
                        className={cn(
                          "flex items-center gap-3 px-5 py-3 transition-colors",
                          isCurrent && "bg-primary-50 border-l-3 border-primary-500",
                          lesson.locked && "opacity-50"
                        )}
                      >
                        <LessonStatusIcon lesson={lesson} index={lIdx} isCurrent={isCurrent} />
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-sm leading-tight",
                              isCurrent ? "font-semibold text-primary-700" : "text-gray-700",
                              lesson.locked && "text-gray-400"
                            )}
                          >
                            {isCurrent && <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-1.5 align-middle" />}
                            Bài {chIdx + 1}.{lIdx}: {lesson.title}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>{lesson.duration}</span>
                          </div>
                        </div>
                        {lesson.locked && <Lock className="w-4 h-4 text-gray-300 shrink-0" />}
                      </div>
                    );

                    if (lesson.locked) {
                      return <div key={lesson.id} className="cursor-not-allowed">{content}</div>;
                    }

                    return (
                      <div key={lesson.id}>
                        <Link href={`/learn/${courseSlug}/${lesson.id}`} className="block">
                          {content}
                        </Link>
                        {/* Show sub-items (quiz/exercise) under current lesson */}
                        {isCurrent && <LessonSubItems chapter={chapter} currentLessonId={currentLessonId} />}
                      </div>
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
