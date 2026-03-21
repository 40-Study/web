"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  CheckCircle,
  Circle,
  Play,
  FileText,
  HelpCircle,
  Code,
  PlayCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Section, Lesson } from "@/types/course";

interface LessonSidebarProps {
  sections: Section[];
  currentLessonId: string;
  courseSlug: string;
  onSelectLesson?: (lessonId: string) => void;
  className?: string;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}p`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}p`;
}

function getLessonIcon(
  type: Lesson["type"],
  completed?: boolean,
  isCurrent?: boolean
) {
  if (completed) {
    return <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />;
  }
  if (isCurrent) {
    return <PlayCircle className="h-4 w-4 text-primary-500 flex-shrink-0" />;
  }

  const iconClass = "h-4 w-4 text-muted-foreground flex-shrink-0";
  switch (type) {
    case "video":
      return <Play className={iconClass} />;
    case "quiz":
      return <HelpCircle className={iconClass} />;
    case "reading":
      return <FileText className={iconClass} />;
    case "exercise":
      return <Code className={iconClass} />;
    default:
      return <Circle className={iconClass} />;
  }
}

export function LessonSidebar({
  sections,
  currentLessonId,
  courseSlug,
  onSelectLesson,
  className,
}: LessonSidebarProps) {
  // Expand sections that contain the current lesson by default
  const currentSectionId = sections.find((s) =>
    s.lessons.some((l) => l.id.toString() === currentLessonId)
  )?.id;

  const [expandedSections, setExpandedSections] = useState<string[]>(
    currentSectionId ? [currentSectionId.toString()] : []
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const totalLessons = sections.reduce((acc, s) => acc + s.lessons.length, 0);
  const completedLessons = sections.reduce(
    (acc, s) => acc + s.lessons.filter((l) => l.completed).length,
    0
  );
  const progressPercent =
    totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  return (
    <aside
      className={cn(
        "w-80 border-l bg-muted/30 overflow-y-auto hidden lg:block",
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="font-semibold">Noi dung khoa hoc</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {completedLessons}/{totalLessons} bai hoc hoan thanh
        </p>
        <ProgressBar value={progressPercent} size="sm" className="mt-2" />
      </div>

      {/* Sections */}
      <div className="p-2">
        {sections.map((section, idx) => {
          const isExpanded = expandedSections.includes(section.id.toString());
          const sectionCompletedCount = section.lessons.filter(
            (l) => l.completed
          ).length;

          return (
            <div key={section.id} className="mb-2">
              {/* Section header */}
              <button
                onClick={() => toggleSection(section.id.toString())}
                className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-muted rounded transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 flex-shrink-0 transition-transform",
                      isExpanded && "rotate-90"
                    )}
                  />
                  <span className="font-medium text-sm truncate">
                    Phan {idx + 1}: {section.title}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground ml-2">
                  {sectionCompletedCount}/{section.lessons.length}
                </span>
              </button>

              {/* Lessons */}
              {isExpanded && (
                <div className="mt-1 space-y-0.5">
                  {section.lessons.map((lesson) => {
                    const isCurrent =
                      lesson.id.toString() === currentLessonId;

                    return (
                      <Link
                        key={lesson.id}
                        href={`/learn/${courseSlug}/${lesson.id}`}
                        onClick={() => onSelectLesson?.(lesson.id.toString())}
                        className={cn(
                          "w-full px-3 py-2 flex items-center gap-3 text-left rounded text-sm transition-colors",
                          isCurrent
                            ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                            : "hover:bg-muted"
                        )}
                      >
                        {getLessonIcon(lesson.type, lesson.completed, isCurrent)}
                        <span className="flex-1 line-clamp-1">
                          {lesson.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDuration(lesson.duration)}
                        </span>
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
