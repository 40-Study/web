"use client";

import { useEffect, useState } from "react";
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
  List,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlayerChapter, PlayerLesson } from "@/types/course-player";

/** Lesson content section for table of contents */
export interface LessonContentSection {
  id: string;
  title: string;
  children?: LessonContentSection[];
}

/** Lesson content data */
export interface LessonContentData {
  title: string;
  lastUpdated: string;
  readingTime: string;
  sections: LessonContentSection[];
  content: string; // HTML or markdown content
}

interface PlayerLessonSidebarProps {
  chapters: PlayerChapter[];
  currentLessonId: string;
  courseSlug: string;
  className?: string;
  /** Optional callback for demo/preview mode - when provided, clicks update state instead of navigating */
  onSelectLesson?: (lessonId: string) => void;
  /** Lesson content data for "Nội dung bài học" tab */
  lessonContent?: LessonContentData;
}

/** Numbered circle icon for each lesson in the sidebar with micro-interactions */
function LessonStatusIcon({ lesson, index, isCurrent }: { lesson: PlayerLesson; index: number; isCurrent: boolean }) {
  if (lesson.completed) {
    return (
      <div
        className={cn(
          "w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0",
          "animate-bounce-in" // Bounce animation on completion
        )}
      >
        <CheckCircle className="w-4 h-4 text-white" />
      </div>
    );
  }
  if (isCurrent) {
    return (
      <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center shrink-0 animate-pulse">
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
    <div className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center shrink-0 transition-all hover:border-primary-300 hover:scale-105">
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

type SidebarTab = "progress" | "content";

/** Table of contents component */
function TableOfContents({
  sections,
  activeSection,
  onSectionClick,
}: {
  sections: LessonContentSection[];
  activeSection: string;
  onSectionClick: (sectionId: string) => void;
}) {
  return (
    <div className="space-y-1">
      {sections.map((section) => (
        <div key={section.id}>
          <button
            onClick={() => onSectionClick(section.id)}
            className={cn(
              "w-full text-left px-3 py-2 text-sm rounded-lg transition-colors",
              activeSection === section.id
                ? "bg-primary-50 text-primary-600 font-medium"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            {section.title}
          </button>
          {section.children && section.children.length > 0 && (
            <div className="ml-4 mt-1 space-y-1">
              {section.children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => onSectionClick(child.id)}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors",
                    activeSection === child.id
                      ? "text-primary-600 font-medium"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  • {child.title}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/** Lesson content view */
function LessonContentView({ content }: { content: LessonContentData }) {
  const [activeSection, setActiveSection] = useState(content.sections[0]?.id || "");
  const [isTocCollapsed, setIsTocCollapsed] = useState(false);

  return (
    <div className="flex h-full">
      {/* Table of Contents */}
      <div
        className={cn(
          "border-r border-gray-100 shrink-0 overflow-y-auto transition-all duration-300",
          isTocCollapsed ? "w-10" : "w-[160px]"
        )}
      >
        {isTocCollapsed ? (
          // Collapsed state - just show expand button
          <button
            onClick={() => setIsTocCollapsed(false)}
            className="w-full h-full flex items-start justify-center pt-4 hover:bg-gray-50 transition-colors"
            title="Mở rộng mục lục"
          >
            <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
          </button>
        ) : (
          // Expanded state
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                MỤC LỤC
              </p>
              <button
                onClick={() => setIsTocCollapsed(true)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Thu gọn mục lục"
              >
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 rotate-90" />
              </button>
            </div>
            <TableOfContents
              sections={content.sections}
              activeSection={activeSection}
              onSectionClick={setActiveSection}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-5 overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900 leading-tight">
          {content.title}
        </h2>
        <p className="text-xs text-gray-500 mt-2">
          Cập nhật lần cuối: {content.lastUpdated} • {content.readingTime} đọc
        </p>

        {/* Rendered content */}
        <div
          className="mt-5 prose prose-sm prose-gray max-w-none
            prose-headings:text-gray-900 prose-headings:font-bold
            prose-h2:text-base prose-h2:mt-6 prose-h2:mb-3
            prose-p:text-gray-600 prose-p:leading-relaxed
            prose-code:bg-gray-900 prose-code:text-gray-100 prose-code:px-3 prose-code:py-2 prose-code:rounded-lg prose-code:text-xs
            prose-pre:bg-gray-900 prose-pre:rounded-lg prose-pre:overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: content.content }}
        />
      </div>
    </div>
  );
}

/** Right sidebar — light theme with progress and chapter accordion */
export function PlayerLessonSidebar({
  chapters,
  currentLessonId,
  courseSlug,
  className,
  onSelectLesson,
  lessonContent,
}: PlayerLessonSidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>("progress");
  // Sidebar 380px cố định chiếm gần hết viewport <1024px (H-10) — trên mobile
  // ẩn mặc định, mở dạng overlay toàn màn hình qua nút nổi bên dưới.
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Đóng overlay mobile bằng phím Esc, không chỉ nút X (L-05).
  useEffect(() => {
    if (!isMobileOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMobileOpen]);

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
    <>
      {/* Nút mở nội dung bài học trên mobile (H-10) — sidebar ẩn mặc định dưới lg */}
      <button
        type="button"
        onClick={() => setIsMobileOpen(true)}
        // left-4 (không phải right) để không đè lên FloatingButtons (AI/Sandbox FAB) ở góc phải.
        className="lg:hidden fixed bottom-24 left-4 z-30 flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg"
        aria-label="Mở nội dung bài học"
      >
        <List className="h-4 w-4" aria-hidden="true" />
        Bài học
      </button>

      <aside
        className={cn(
          "bg-white border-l border-gray-200 overflow-hidden flex flex-col",
          // Desktop (≥lg): sidebar cố định 380px trong layout.
          "lg:static lg:flex lg:w-[380px] lg:shrink-0",
          // Mobile (<lg): ẩn mặc định, mở thành overlay toàn màn hình.
          isMobileOpen ? "fixed inset-0 z-40 flex w-full" : "hidden lg:flex",
          className
        )}
      >
        <button
          type="button"
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden absolute right-3 top-3 z-10 rounded-full bg-gray-100 p-2 hover:bg-gray-200"
          aria-label="Đóng nội dung bài học"
        >
          <X className="h-4 w-4 text-gray-600" aria-hidden="true" />
        </button>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 shrink-0">
        <button
          onClick={() => setActiveTab("progress")}
          className={cn(
            "flex-1 py-3 text-sm font-medium text-center transition-colors border-b-2 -mb-px",
            activeTab === "progress"
              ? "border-primary-500 text-primary-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          Tiến trình bài học
        </button>
        <button
          onClick={() => setActiveTab("content")}
          className={cn(
            "flex-1 py-3 text-sm font-medium text-center transition-colors border-b-2 -mb-px",
            activeTab === "content"
              ? "border-primary-500 text-primary-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          Nội dung bài học
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "content" && lessonContent ? (
        <LessonContentView content={lessonContent} />
      ) : activeTab === "content" ? (
        <div className="flex-1 flex items-center justify-center p-5">
          <p className="text-sm text-gray-500 text-center">
            Chưa có nội dung bài học.
          </p>
        </div>
      ) : (
        <>
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
          <div className="flex-1 overflow-y-auto">
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

                    // Demo mode: use callback instead of navigation
                    if (onSelectLesson) {
                      return (
                        <div key={lesson.id}>
                          <button
                            type="button"
                            onClick={() => onSelectLesson(lesson.id)}
                            className="block w-full text-left"
                          >
                            {content}
                          </button>
                          {isCurrent && <LessonSubItems chapter={chapter} currentLessonId={currentLessonId} />}
                        </div>
                      );
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
        </>
      )}
      </aside>
    </>
  );
}
