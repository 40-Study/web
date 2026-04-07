"use client";

/**
 * My Courses - enrolled courses page
 * Uses real enrollment API data
 */
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { StatsWidgets } from "@/components/student/stats-widgets";
import { FeaturedCourseCard } from "@/components/student/featured-course-card";
import { EnrolledCourseCard } from "@/components/student/enrolled-course-card";
import { MyCourseSidebar } from "@/components/student/my-courses-sidebar";
import { useEnrolledCourses } from "@/hooks/use-courses";

// Static achievements (gamification API not wired yet)
const achievements = [
  { id: "1", title: "Khởi đầu hoàn hảo", description: "Hoàn thành khóa học đầu tiên", icon: "🏆", earnedAt: "01/03/2024", color: "bg-yellow-100 text-yellow-700" },
  { id: "2", title: "7 ngày liên tiếp", description: "Học liên tục 7 ngày", icon: "🔥", earnedAt: "10/03/2024", color: "bg-orange-100 text-orange-700" },
  { id: "3", title: "Chiến binh Backend", description: "Hoàn thành 5 bài về Backend", icon: "⚡", earnedAt: "15/03/2024", color: "bg-purple-100 text-purple-700" },
];

export default function MyCoursesPage() {
  const { data: enrolledCourses = [], isLoading } = useEnrolledCourses();

  // Most recently accessed course as featured
  const sortedByAccess = [...enrolledCourses].sort((a, b) => {
    const aTime = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0;
    const bTime = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0;
    return bTime - aTime;
  });
  const featured = sortedByAccess[0];
  const otherCourses = sortedByAccess.slice(1);

  // Calculate overall progress
  const avgProgress = enrolledCourses.length > 0
    ? Math.round(enrolledCourses.reduce((sum, c) => sum + c.progress, 0) / enrolledCourses.length)
    : 0;

  const stats = { timeSpent: "--", progress: avgProgress };

  // Map enrolled courses for card display
  const cardCourses = enrolledCourses.map((c) => ({
    id: String(c.id),
    slug: c.slug,
    title: c.title,
    thumbnail: c.thumbnail,
    progress: c.progress,
    category: c.category?.name?.toUpperCase() || "KHÓA HỌC",
  }));

  // Sidebar courses (other enrolled, max 3)
  const sidebarCourses = otherCourses.slice(0, 3).map((c) => ({
    id: String(c.id),
    slug: c.slug,
    title: c.title,
    progress: c.progress,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Khóa học của tôi</h1>
          <p className="text-gray-500 mt-1">
            {enrolledCourses.length > 0
              ? `Bạn đang học ${enrolledCourses.length} khóa học.`
              : "Chưa đăng ký khóa học nào."}
          </p>
        </div>
        <StatsWidgets stats={stats} />
      </div>

      {enrolledCourses.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">Bạn chưa đăng ký khóa học nào.</p>
          <Link href="/courses" className="text-primary-600 font-semibold hover:underline">
            Khám phá khóa học →
          </Link>
        </div>
      ) : (
        <div className="flex gap-6">
          {/* Left: Main content */}
          <div className="flex-1 min-w-0 space-y-8">
            {/* Featured / recently learning */}
            {featured && (
              <section>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                  Đang học gần đây
                </h2>
                <FeaturedCourseCard
                  course={{
                    id: String(featured.id),
                    slug: featured.slug,
                    title: featured.title,
                    tags: [featured.category?.name?.toUpperCase() || "KHÓA HỌC"],
                    progress: featured.progress,
                    completedLessons: featured.completedLessons,
                    totalLessons: featured.totalLessons || featured.lessonCount,
                    nextLesson: "Tiếp tục bài học",
                  }}
                />
              </section>
            )}

            {/* Enrolled courses grid */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Khóa học của tôi
                </h2>
                <Link
                  href="/courses"
                  className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                >
                  XEM TẤT CẢ
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {cardCourses.map((course) => (
                  <EnrolledCourseCard
                    key={course.id}
                    course={course}
                    href={`/courses/${course.slug}`}
                  />
                ))}
              </div>
            </section>
          </div>

          {/* Right: Sidebar */}
          <MyCourseSidebar
            otherCourses={sidebarCourses}
            achievements={achievements}
          />
        </div>
      )}
    </div>
  );
}
