"use client";

import { Star, Play, Heart, Clock, Users, BookOpen } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CourseDetail } from "@/types/course";

interface CourseHeroProps {
  course: CourseDetail;
  isEnrolled?: boolean;
  progress?: number;
  onEnroll?: () => void;
  onPreview?: () => void;
  className?: string;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} phút`;
  if (mins === 0) return `${hours} giờ`;
  return `${hours} giờ ${mins} phút`;
}

export function CourseHero({
  course,
  isEnrolled = false,
  progress = 0,
  onEnroll,
  onPreview,
  className,
}: CourseHeroProps) {
  return (
    <div
      className={cn(
        "bg-gradient-to-r from-primary-900 to-secondary-900 text-white",
        className
      )}
    >
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Thumbnail with play button */}
          <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl">
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-full object-cover"
            />
            <button
              onClick={onPreview}
              className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition group"
            >
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="h-8 w-8 text-primary-600 ml-1" />
              </div>
            </button>
          </div>

          {/* Course info */}
          <div>
            {/* Category Badge */}
            <span className="inline-block bg-white/20 text-white text-sm font-medium px-3 py-1 rounded-full mb-3">
              {course.category.name}
            </span>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              {course.title}
            </h1>

            {/* Description */}
            <p className="text-lg opacity-90 mb-4 line-clamp-2">
              {course.description}
            </p>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-bold">{course.rating.toFixed(1)}</span>
                <span className="opacity-75">({course.reviewCount} đánh giá)</span>
              </div>
              <span className="opacity-75">•</span>
              <div className="flex items-center gap-1 opacity-75">
                <Users className="h-4 w-4" />
                <span>{course.studentCount.toLocaleString()} học viên</span>
              </div>
            </div>

            {/* Course Meta */}
            <div className="flex flex-wrap gap-4 mb-4 text-sm opacity-90">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{formatDuration(course.duration)}</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                <span>{course.lessonCount} bài học</span>
              </div>
              <span className="capitalize">
                {course.level === "beginner"
                  ? "Cơ bản"
                  : course.level === "intermediate"
                  ? "Trung cấp"
                  : "Nâng cao"}
              </span>
            </div>

            {/* Instructor */}
            <div className="flex items-center gap-3 mb-6">
              <img
                src={course.instructor.avatar}
                alt={course.instructor.name}
                className="w-10 h-10 rounded-full"
              />
              <span>
                Giảng viên:{" "}
                <strong className="text-white">{course.instructor.name}</strong>
              </span>
            </div>

            {/* CTA */}
            {isEnrolled ? (
              <div className="space-y-3">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Tiến độ học tập</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-xp transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <Button
                  size="lg"
                  className="w-full md:w-auto bg-white text-primary-900 hover:bg-white/90"
                >
                  Tiếp tục học
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="lg"
                  className="flex-1 md:flex-none bg-white text-primary-900 hover:bg-white/90"
                  onClick={onEnroll}
                >
                  {course.price === 0
                    ? "Đăng ký miễn phí"
                    : `Đăng ký - ${formatCurrency(course.price)}`}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-white border-white hover:bg-white/10"
                >
                  <Heart className="h-5 w-5" />
                </Button>
              </div>
            )}

            {/* Original Price */}
            {!isEnrolled &&
              course.originalPrice &&
              course.originalPrice > course.price && (
                <p className="mt-2 text-sm opacity-75">
                  <span className="line-through">
                    {formatCurrency(course.originalPrice)}
                  </span>
                  <span className="ml-2 text-xp-light font-medium">
                    Tiết kiệm{" "}
                    {Math.round(
                      (1 - course.price / course.originalPrice) * 100
                    )}
                    %
                  </span>
                </p>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
