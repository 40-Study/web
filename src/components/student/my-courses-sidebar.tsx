"use client";

import Link from "next/link";
import { ProgressBar } from "@/components/ui/progress-bar";
import { AchievementSidebar } from "./achievement-sidebar";
import { MentorChatWidget } from "./mentor-chat-widget";
import type { OtherLearningCourse, Achievement } from "@/lib/mock-data/my-courses";

interface MyCourseSidebarProps {
  otherCourses: OtherLearningCourse[];
  achievements: Achievement[];
}

export function MyCourseSidebar({ otherCourses, achievements }: MyCourseSidebarProps) {
  return (
    <div className="w-72 flex-shrink-0 space-y-4">
      {/* Other learning courses */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
            Đang học khác
          </h3>
          <Link
            href="/student/courses"
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            Xem tất cả
          </Link>
        </div>

        <div className="space-y-4">
          {otherCourses.map((course) => (
            <Link
              key={course.id}
              href={`/learn/${course.id}`}
              className="group block"
            >
              <div className="flex items-center gap-3 mb-1.5">
                {/* Color dot */}
                <div className="w-2 h-2 rounded-full bg-primary-400 flex-shrink-0" />
                <p className="text-sm text-gray-800 font-medium group-hover:text-primary-600 transition-colors line-clamp-1 flex-1">
                  {course.title}
                </p>
                <span className="text-xs text-gray-400 flex-shrink-0">{course.progress}%</span>
              </div>
              <div className="pl-5">
                <ProgressBar value={course.progress} variant="course" size="sm" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <AchievementSidebar achievements={achievements} />

      {/* Mentor chat */}
      <MentorChatWidget />
    </div>
  );
}
