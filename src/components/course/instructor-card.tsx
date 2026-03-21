"use client";

import { Star, Users, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Instructor } from "@/types/course";

interface InstructorCardProps {
  instructor: Instructor;
  className?: string;
}

export function InstructorCard({ instructor, className }: InstructorCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <img
            src={instructor.avatar}
            alt={instructor.name}
            className="w-20 h-20 rounded-full object-cover flex-shrink-0"
          />

          <div className="flex-1 min-w-0">
            {/* Name and Title */}
            <h3 className="text-lg font-semibold">{instructor.name}</h3>
            {instructor.title && (
              <p className="text-sm text-muted-foreground mb-2">
                {instructor.title}
              </p>
            )}

            {/* Stats */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {instructor.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{instructor.rating.toFixed(1)} đánh giá</span>
                </div>
              )}
              {instructor.studentCount && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{instructor.studentCount.toLocaleString()} học viên</span>
                </div>
              )}
              {instructor.courseCount && (
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{instructor.courseCount} khóa học</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {instructor.bio && (
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            {instructor.bio}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
