"use client";

import { useState } from "react";
import {
  ChevronRight,
  CheckCircle,
  Circle,
  Play,
  FileText,
  HelpCircle,
  Code,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Section, Lesson } from "@/types/course";

interface CourseSyllabusProps {
  sections: Section[];
  isEnrolled?: boolean;
  className?: string;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} giờ`;
  return `${hours}h ${mins}p`;
}

function getLessonIcon(type: Lesson["type"]) {
  switch (type) {
    case "video":
      return Play;
    case "quiz":
      return HelpCircle;
    case "reading":
      return FileText;
    case "exercise":
      return Code;
    default:
      return Circle;
  }
}

function getLessonTypeLabel(type: Lesson["type"]) {
  switch (type) {
    case "video":
      return "Video";
    case "quiz":
      return "Kiểm tra";
    case "reading":
      return "Tài liệu";
    case "exercise":
      return "Bài tập";
    default:
      return "";
  }
}

export function CourseSyllabus({
  sections,
  isEnrolled = false,
  className,
}: CourseSyllabusProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(
    sections.length > 0 ? [sections[0].id.toString()] : []
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const expandAll = () => {
    setExpandedSections(sections.map((s) => s.id.toString()));
  };

  const collapseAll = () => {
    setExpandedSections([]);
  };

  const totalLessons = sections.reduce((acc, s) => acc + s.lessons.length, 0);
  const totalDuration = sections.reduce((acc, s) => acc + s.duration, 0);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Nội dung khóa học</h2>
          <p className="text-sm text-muted-foreground">
            {sections.length} phần • {totalLessons} bài học •{" "}
            {formatDuration(totalDuration)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={expandAll}>
            Mở tất cả
          </Button>
          <Button variant="ghost" size="sm" onClick={collapseAll}>
            Thu gọn
          </Button>
        </div>
      </div>

      {/* Sections */}
      <div className="border rounded-lg overflow-hidden">
        {sections.map((section, idx) => {
          const isExpanded = expandedSections.includes(section.id.toString());
          const completedCount = section.lessons.filter(
            (l) => l.completed
          ).length;

          return (
            <div
              key={section.id}
              className={cn(idx !== 0 && "border-t")}
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id.toString())}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ChevronRight
                    className={cn(
                      "h-5 w-5 transition-transform text-muted-foreground",
                      isExpanded && "rotate-90"
                    )}
                  />
                  <div className="text-left">
                    <p className="font-medium">
                      Phần {idx + 1}: {section.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {section.lessons.length} bài học •{" "}
                      {formatDuration(section.duration)}
                    </p>
                  </div>
                </div>
                {isEnrolled && (
                  <span className="text-sm text-muted-foreground">
                    {completedCount}/{section.lessons.length}
                  </span>
                )}
              </button>

              {/* Lessons */}
              {isExpanded && (
                <div className="bg-muted/30">
                  {section.lessons.map((lesson) => {
                    const LessonIcon = getLessonIcon(lesson.type);
                    const canAccess = isEnrolled || lesson.isFreePreview;

                    return (
                      <div
                        key={lesson.id}
                        className={cn(
                          "flex items-center justify-between py-3 px-4 pl-12 border-t border-muted",
                          canAccess && "hover:bg-muted/50 cursor-pointer"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {/* Completion Status or Lock */}
                          {isEnrolled ? (
                            lesson.completed ? (
                              <CheckCircle className="h-5 w-5 text-xp flex-shrink-0" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            )
                          ) : canAccess ? (
                            <LessonIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          )}

                          <div>
                            <span
                              className={cn(
                                lesson.completed && "text-muted-foreground"
                              )}
                            >
                              {lesson.title}
                            </span>
                            {lesson.type !== "video" && (
                              <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded">
                                {getLessonTypeLabel(lesson.type)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">
                            {formatDuration(lesson.duration)}
                          </span>
                          {!isEnrolled && lesson.isFreePreview && (
                            <Button size="sm" variant="ghost">
                              Xem trước
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
