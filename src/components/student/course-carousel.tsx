"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Users, Eye, Clock } from "lucide-react";
import type { RecommendedCourse } from "@/lib/mock-data/student-dashboard";

interface CourseCarouselProps {
  title: string;
  subtitle: string;
  courses: RecommendedCourse[];
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(0) + "K";
  }
  return num.toString();
}

export function CourseCarousel({ title, subtitle, courses }: CourseCarouselProps) {
  const [scrollIndex, setScrollIndex] = useState(0);
  const visibleCount = 4;
  const maxIndex = Math.max(0, courses.length - visibleCount);

  const handlePrev = () => setScrollIndex((prev) => Math.max(0, prev - 1));
  const handleNext = () => setScrollIndex((prev) => Math.min(maxIndex, prev + 1));

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePrev}
            disabled={scrollIndex === 0}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            disabled={scrollIndex >= maxIndex}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="overflow-hidden">
        <div
          className="flex gap-4 transition-transform duration-300"
          style={{ transform: `translateX(-${scrollIndex * (100 / visibleCount + 1)}%)` }}
        >
          {courses.map((course) => (
            <div key={course.id} className="flex-shrink-0 w-[calc(25%-12px)]">
              <CourseCard course={course} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CourseCard({ course }: { course: RecommendedCourse }) {
  return (
    <div className="group cursor-pointer">
      {/* Thumbnail */}
      <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 mb-3 overflow-hidden relative">
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
          <div className="w-16 h-16 mb-2">
            {/* Diamond icon placeholder */}
            <svg viewBox="0 0 64 64" className="w-full h-full opacity-80">
              <path
                d="M32 8L8 28L32 56L56 28L32 8Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path d="M8 28H56" stroke="currentColor" strokeWidth="2" />
              <path d="M32 8L24 28L32 56L40 28L32 8Z" fill="currentColor" opacity="0.3" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-center">HTML, CSS</h3>
          <p className="text-sm opacity-80">từ zero đến hero</p>
        </div>
      </div>

      {/* Info */}
      <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors line-clamp-1">
        {course.title}
      </h4>

      <p className="text-orange-500 font-semibold mb-2">{formatPrice(course.price)}</p>

      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {formatNumber(course.students)}
        </span>
        <span className="flex items-center gap-1">
          <Eye className="w-3.5 h-3.5" />
          {course.likes}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {course.duration}
        </span>
      </div>
    </div>
  );
}
