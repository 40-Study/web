"use client";

import { Star, Users, BookOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Instructor } from "@/types/course";

interface InstructorCardProps {
  instructor: Instructor;
  className?: string;
}

export function InstructorCard({ instructor, className }: InstructorCardProps) {
  const displayName = instructor.name && instructor.name !== "Unknown"
    ? instructor.name
    : "Chưa cập nhật";

  const hasAvatar = instructor.avatar && instructor.avatar.trim() !== "";

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          {hasAvatar ? (
            <img
              src={instructor.avatar}
              alt={displayName}
              className="w-20 h-20 rounded-full object-cover flex-shrink-0 bg-gray-100"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.nextElementSibling?.classList.remove("hidden");
              }}
            />
          ) : null}
          <div className={cn(
            "w-20 h-20 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center flex-shrink-0",
            hasAvatar && "hidden"
          )}>
            <User className="w-10 h-10 text-primary-600" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Name and Title */}
            <h3 className="text-lg font-semibold text-gray-900">{displayName}</h3>
            {instructor.title && (
              <p className="text-sm text-muted-foreground mb-2">
                {instructor.title}
              </p>
            )}

            {/* Stats */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {instructor.rating != null && instructor.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{instructor.rating.toFixed(1)} đánh giá</span>
                </div>
              )}
              {instructor.studentCount != null && instructor.studentCount > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{instructor.studentCount.toLocaleString()} học viên</span>
                </div>
              )}
              {instructor.courseCount != null && instructor.courseCount > 0 && (
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
