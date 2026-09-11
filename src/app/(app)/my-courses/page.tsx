"use client";

/**
 * My Courses Page - Shows enrolled courses and learning progress
 * Layout: 2-column with main content and sidebar
 */

import { useMemo } from "react";
import Link from "next/link";
import { Loader2, BookOpen, Award, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useEnrolledCourses } from "@/hooks/use-courses";
import { useMyCertificates } from "@/hooks/queries/use-certificates";
import { StatsWidgets } from "@/components/student/stats-widgets";
import { CurrentCourseHero } from "@/components/student/current-course-hero";
import { OtherCoursesSidebar } from "@/components/student/other-courses-sidebar";
import { EnrolledCourseCard } from "@/components/student/enrolled-course-card";
import { AchievementSidebar } from "@/components/student/achievement-sidebar";
import { SupportCard } from "@/components/student/support-card";

/** Định dạng tổng thời gian học từ số giây thật (0 giây → "0m"). */
function formatStudyTime(totalSeconds: number): string {
  const safeSeconds = Number.isFinite(totalSeconds) && totalSeconds > 0 ? Math.floor(totalSeconds) : 0;
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-4 w-64 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded-2xl" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <BookOpen className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Chưa có khóa học nào
      </h3>
      <p className="text-sm text-gray-500 text-center mb-6 max-w-sm">
        Bạn chưa đăng ký khóa học nào. Khám phá các khóa học để bắt đầu hành trình học tập!
      </p>
      <Link
        href="/courses"
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
      >
        Khám phá khóa học
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

export default function MyCoursesPage() {
  const { user } = useAuthStore();
  const { data: enrolledCourses = [], isLoading: coursesLoading } = useEnrolledCourses();
  const { data: certificatesData } = useMyCertificates({ page_size: 5 });

  // Sort courses by last accessed, most recent first
  const sortedCourses = useMemo(() => {
    return [...enrolledCourses].sort((a, b) => {
      const dateA = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0;
      const dateB = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [enrolledCourses]);

  // Most recent course being studied (with progress > 0)
  const currentCourse = useMemo(() => {
    return sortedCourses.find((c) => c.progress > 0 && c.progress < 100);
  }, [sortedCourses]);

  // Other courses being studied
  const otherCourses = useMemo(() => {
    if (!currentCourse) return sortedCourses.filter((c) => c.progress > 0 && c.progress < 100);
    return sortedCourses.filter(
      (c) => c.id !== currentCourse.id && c.progress > 0 && c.progress < 100
    );
  }, [sortedCourses, currentCourse]);

  // All enrolled courses (for grid)
  const allCourses = sortedCourses;

  // Calculate stats
  const stats = useMemo(() => {
    const totalProgress = enrolledCourses.length
      ? Math.round(enrolledCourses.reduce((sum, c) => sum + c.progress, 0) / enrolledCourses.length)
      : 0;
    // Thời gian học THẬT: cộng video_watched_seconds của mọi bài trong mọi khóa đã ghi danh
    // (backend trả về ở trường watched_seconds của /enrollments). Trước đây ô này hiển thị
    // chuỗi cứng "1h 45m" cho mọi người học.
    const totalSeconds = enrolledCourses.reduce((sum, c) => sum + (c.watchedSeconds ?? 0), 0);
    return {
      timeSpent: formatStudyTime(totalSeconds),
      progress: totalProgress,
    };
  }, [enrolledCourses]);

  // Map certificates to achievement format
  const achievements = useMemo(() => {
    const certs = certificatesData?.data ?? [];
    return certs.slice(0, 3).map((cert) => ({
      id: cert.id,
      title: cert.course_name || "Chứng chỉ",
      description: "",
      icon: "🏆",
      earnedAt: cert.issued_at
        ? `Hoàn thành: ${new Date(cert.issued_at).toLocaleDateString("vi-VN", {
            month: "short",
            year: "numeric",
          })}`
        : "",
      color: "bg-yellow-100",
    }));
  }, [certificatesData]);

  if (coursesLoading) {
    return <LoadingSkeleton />;
  }

  const firstName = user?.name?.split(" ").pop() || "bạn";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Khóa học của tôi</h1>
            <p className="text-gray-500 mt-1">
              Chào mừng trở lại {firstName}, hãy tập trung vào mục tiêu hôm nay.
            </p>
          </div>
          <StatsWidgets stats={stats} />
        </div>

        {enrolledCourses.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - 2 columns */}
            <div className="lg:col-span-2 space-y-8">
              {/* Đang học gần đây */}
              {currentCourse && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <h2 className="text-xs font-bold text-green-600 uppercase tracking-wide">
                      Đang học gần đây
                    </h2>
                  </div>
                  <CurrentCourseHero
                    course={currentCourse}
                    currentChapter="Đang học"
                    nextLessonTitle="Tiếp tục bài học"
                  />
                </section>
              )}

              {/* Khóa học của tôi - Grid */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary-500" />
                    <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                      Khóa học của tôi
                    </h2>
                  </div>
                  {allCourses.length > 4 && (
                    <Link
                      href="/courses"
                      className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      Xem tất cả
                    </Link>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {allCourses.slice(0, 6).map((course) => (
                    <EnrolledCourseCard key={course.id} course={course} />
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar - 1 column */}
            <div className="space-y-6">
              {/* Đang học khác */}
              {otherCourses.length > 0 && (
                <OtherCoursesSidebar courses={otherCourses} maxItems={3} />
              )}

              {/* Bức tường thành tựu */}
              {achievements.length > 0 ? (
                <AchievementSidebar achievements={achievements} />
              ) : (
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="w-4 h-4 text-yellow-500" />
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                      Bức tường thành tựu
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 text-center py-4">
                    Hoàn thành khóa học để nhận chứng chỉ đầu tiên!
                  </p>
                  <Link
                    href="/achievements"
                    className="block text-center text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors py-2 border-t border-gray-100"
                  >
                    Xem chứng chỉ của tôi →
                  </Link>
                </div>
              )}

              {/* Cần hỗ trợ? */}
              <SupportCard variant="gradient" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
