"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, BookOpen } from "lucide-react";
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
  const [imgError, setImgError] = useState(false);

  return (
    <Link href={`/courses/${course.slug}`}>
      <Card
        className={cn(
          "overflow-hidden group cursor-pointer h-full border-slate-200/60 rounded-2xl bg-white",
          "will-change-transform transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
          "hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/50",
          className
        )}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-slate-100">
          {!imgError && course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
              <BookOpen className="w-10 h-10 text-slate-300" />
            </div>
          )}
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {course.price === 0 && (
            <span className="absolute top-3 left-3 bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md shadow-emerald-500/25">
              Miễn phí
            </span>
          )}
          {course.originalPrice && course.originalPrice > course.price && (
            <span className="absolute top-3 right-3 bg-rose-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md shadow-rose-500/25">
              -{Math.round((1 - course.price / course.originalPrice) * 100)}%
            </span>
          )}
          {enrolled && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-200/50">
              <div
                className="h-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-300"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          )}
        </div>

        <CardContent className="p-5">
          {/* Title */}
          <h3 className="font-semibold line-clamp-2 mb-1.5 text-slate-900 group-hover:text-primary-600 transition-colors duration-200">
            {course.title}
          </h3>

          {/* Instructor */}
          <p className="text-sm text-slate-500 mb-2.5">
            {course.instructor.name}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mb-3">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-sm text-slate-900">{course.rating.toFixed(1)}</span>
            <span className="text-xs text-slate-400">
              ({course.reviewCount})
            </span>
            <span className="text-xs text-slate-400 ml-1">
              &middot; {course.studentCount.toLocaleString()} học viên
            </span>
          </div>

          {/* Price or Progress */}
          {enrolled ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">
                {course.progress}% hoàn thành
              </span>
              <Button size="sm" className="rounded-xl bg-primary-600 hover:bg-primary-700" onClick={(e) => e.preventDefault()}>
                Tiếp tục
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900">
                  {course.price === 0 ? "Miễn phí" : formatCurrency(course.price)}
                </span>
                {course.originalPrice && course.originalPrice > course.price && (
                  <span className="text-sm text-slate-400 line-through">
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
