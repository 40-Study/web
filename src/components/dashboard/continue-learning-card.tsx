"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";

interface Course {
  id: string;
  title: string;
  thumbnail: string;
  currentLesson: number;
  totalLessons: number;
  progress: number;
  estimatedTime?: number;
}

interface ContinueLearningCardProps {
  course: Course;
  className?: string;
}

export function ContinueLearningCard({
  course,
  className,
}: ContinueLearningCardProps) {
  return (
    <Card className={cn("p-4 flex gap-4", className)}>
      {/* Course Thumbnail */}
      <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
        {course.thumbnail ? (
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center">
            <Play className="w-8 h-8 text-white" />
          </div>
        )}
      </div>

      {/* Course Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-lg line-clamp-1">{course.title}</h3>

        <div className="flex items-center gap-2 mt-1">
          <p className="text-sm text-muted-foreground">
            Lesson {course.currentLesson}/{course.totalLessons}
          </p>
          {course.estimatedTime && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {course.estimatedTime}m
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 my-2">
          <ProgressBar value={course.progress} variant="course" size="sm" className="flex-1" />
          <span className="text-xs text-muted-foreground font-medium">
            {course.progress}%
          </span>
        </div>

        <Button size="sm" className="mt-1" asChild>
          <Link href={`/courses/${course.id}/learn`}>
            <Play className="w-4 h-4 mr-1" />
            Continue
          </Link>
        </Button>
      </div>
    </Card>
  );
}
