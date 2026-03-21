import Link from "next/link";
import { StatsWidgets } from "@/components/student/stats-widgets";
import { FeaturedCourseCard } from "@/components/student/featured-course-card";
import { EnrolledCourseCard } from "@/components/student/enrolled-course-card";
import { MyCourseSidebar } from "@/components/student/my-courses-sidebar";
import {
  mockTodayStats,
  mockFeaturedCourse,
  mockEnrolledCourses,
  mockOtherLearning,
  mockAchievements,
} from "@/lib/mock-data/my-courses";

export default function MyCoursesPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Khóa học của tôi</h1>
          <p className="text-gray-500 mt-1">
            Chào mừng trở lại, hãy tập trung vào mục tiêu hôm nay.
          </p>
        </div>
        <StatsWidgets stats={mockTodayStats} />
      </div>

      {/* Main layout */}
      <div className="flex gap-6">
        {/* Left: Main content */}
        <div className="flex-1 min-w-0 space-y-8">
          {/* Featured / recently learning */}
          <section>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
              Đang học gần đây
            </h2>
            <FeaturedCourseCard course={mockFeaturedCourse} />
          </section>

          {/* Enrolled courses grid */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Khóa học của tôi
              </h2>
              <Link
                href="/my-courses"
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
              >
                XEM TẤT CẢ
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {mockEnrolledCourses.map((course) => (
                <EnrolledCourseCard key={course.id} course={course} />
              ))}
            </div>
          </section>
        </div>

        {/* Right: Sidebar */}
        <MyCourseSidebar
          otherCourses={mockOtherLearning}
          achievements={mockAchievements}
        />
      </div>
    </div>
  );
}
