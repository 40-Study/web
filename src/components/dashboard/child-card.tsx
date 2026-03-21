"use client";

import { Flame, Clock, BookOpen, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";

interface ChildProgress {
  id: string;
  name: string;
  avatar?: string;
  streak: number;
  weeklyLessons: number;
  weeklyTime: number;
  courses: Array<{
    id: string;
    title: string;
    progress: number;
    lastActivity: string;
  }>;
}

interface ChildCardProps {
  child: ChildProgress;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  className?: string;
}

export function ChildCard({
  child,
  isSelected = false,
  onSelect,
  className,
}: ChildCardProps) {
  return (
    <Card
      className={cn(
        "p-4 transition-all cursor-pointer",
        isSelected
          ? "ring-2 ring-primary-500 bg-primary-50/50 dark:bg-primary-900/20"
          : "hover:shadow-md",
        className
      )}
      onClick={() => onSelect?.(child.id)}
    >
      {/* Child Header */}
      <div className="flex items-center gap-3 mb-4">
        <Avatar
          src={child.avatar}
          fallback={child.name}
          size="lg"
          status={child.streak > 0 ? "streak" : undefined}
        />
        <div>
          <h3 className="font-semibold text-lg">{child.name}</h3>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Flame className="w-4 h-4 text-orange-500" />
              {child.streak} days
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatTime(child.weeklyTime)}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              {child.weeklyLessons} lessons
            </span>
          </div>
        </div>
      </div>

      {/* Courses Progress */}
      <div className="space-y-3">
        {child.courses.slice(0, 3).map((course) => (
          <div key={course.id} className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium truncate">{course.title}</p>
                <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                  {course.progress}%
                </span>
              </div>
              <ProgressBar value={course.progress} size="sm" variant="course" />
              <p className="text-xs text-muted-foreground mt-1">
                Last: {course.lastActivity}
              </p>
            </div>
            {course.progress === 100 && (
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}
