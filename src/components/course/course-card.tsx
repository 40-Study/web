"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Course, EnrolledCourse } from "@/types/course";

interface CourseCardProps {
  course: Course | EnrolledCourse;
  className?: string;
}

function isEnrolledCourse(
  course: Course | EnrolledCourse
): course is EnrolledCourse {
  return "progress" in course;
}

export function CourseCard({ course, className }: CourseCardProps) {
  const enrolled = isEnrolledCourse(course);

  return (
    <Link href={`/courses/${course.slug}`}>
      <Card
        className={cn(
          "overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer h-full",
          className
        )}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {course.price === 0 && (
            <span className="absolute top-2 left-2 bg-green-500 text-white text-xs font-medium px-2 py-1 rounded">
              Miễn phí
            </span>
          )}
          {course.originalPrice && course.originalPrice > course.price && (
            <span className="absolute top-2 right-2 bg-destructive text-white text-xs font-medium px-2 py-1 rounded">
              -{Math.round((1 - course.price / course.originalPrice) * 100)}%
            </span>
          )}
          {enrolled && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
              <div
                className="h-full bg-primary-500 transition-all duration-300"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          )}
        </div>

        <CardContent className="p-4">
          {/* Title */}
          <h3 className="font-semibold line-clamp-2 mb-1 group-hover:text-primary-600 transition-colors">
            {course.title}
          </h3>

          {/* Instructor */}
          <p className="text-sm text-muted-foreground mb-2">
            {course.instructor.name}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-3">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium text-sm">{course.rating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">
              ({course.reviewCount})
            </span>
            <span className="text-xs text-muted-foreground ml-1">
              • {course.studentCount.toLocaleString()} học viên
            </span>
          </div>

          {/* Price or Progress */}
          {enrolled ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {course.progress}% hoàn thành
              </span>
              <Button size="sm" onClick={(e) => e.preventDefault()}>
                Tiếp tục
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">
                  {course.price === 0 ? "Miễn phí" : formatCurrency(course.price)}
                </span>
                {course.originalPrice && course.originalPrice > course.price && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatCurrency(course.originalPrice)}
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
