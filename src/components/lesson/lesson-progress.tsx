"use client";

import { cn } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/progress-bar";

interface LessonProgressProps {
  completedLessons: number;
  totalLessons: number;
  currentLessonProgress?: number; // 0-100 for video progress
  className?: string;
}

export function LessonProgress({
  completedLessons,
  totalLessons,
  currentLessonProgress = 0,
  className,
}: LessonProgressProps) {
  const overallProgress =
    totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {/* Overall course progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-muted-foreground">Tien trinh khoa hoc</span>
          <span className="font-medium">
            {completedLessons}/{totalLessons}
          </span>
        </div>
        <ProgressBar value={overallProgress} variant="course" size="sm" />
      </div>

      {/* Current lesson progress (for video) */}
      {currentLessonProgress > 0 && (
        <div className="w-24">
          <div className="text-xs text-muted-foreground mb-1 text-center">
            Bai hien tai
          </div>
          <ProgressBar value={currentLessonProgress} size="sm" />
        </div>
      )}
    </div>
  );
}
