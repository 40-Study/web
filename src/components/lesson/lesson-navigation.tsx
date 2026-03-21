"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface LessonInfo {
  id: string;
  title: string;
}

interface LessonNavigationProps {
  courseSlug: string;
  prevLesson?: LessonInfo;
  nextLesson?: LessonInfo;
  onCompleteCourse?: () => void;
  className?: string;
}

export function LessonNavigation({
  courseSlug,
  prevLesson,
  nextLesson,
  onCompleteCourse,
  className,
}: LessonNavigationProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-t pt-4 mt-6",
        className
      )}
    >
      {prevLesson ? (
        <Button variant="outline" asChild>
          <Link
            href={`/learn/${courseSlug}/${prevLesson.id}`}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <div className="text-left">
              <p className="text-xs text-muted-foreground">Truoc</p>
              <p className="text-sm font-medium line-clamp-1 max-w-[150px]">
                {prevLesson.title}
              </p>
            </div>
          </Link>
        </Button>
      ) : (
        <div />
      )}

      {nextLesson ? (
        <Button asChild>
          <Link
            href={`/learn/${courseSlug}/${nextLesson.id}`}
            className="flex items-center gap-2"
          >
            <div className="text-right">
              <p className="text-xs opacity-80">Tiep theo</p>
              <p className="text-sm font-medium line-clamp-1 max-w-[150px]">
                {nextLesson.title}
              </p>
            </div>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      ) : (
        <Button onClick={onCompleteCourse}>Hoan thanh khoa hoc</Button>
      )}
    </div>
  );
}
