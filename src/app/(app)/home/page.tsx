"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { CourseCard } from "@/components/course/course-card";
import {
  ContinueLearningCard,
  StreakCard,
  XPProgressCard,
  TodaySchedule,
  buildTodaySchedule,
  getGreeting,
  formatToday,
} from "@/components/dashboard";
import { useAuthStore } from "@/stores/auth.store";
import { useEnrolledCourses, useFeaturedCourses } from "@/hooks/use-courses";
import { useMySchedules } from "@/hooks/queries/use-class-schedule";
import { usePublicProfile } from "@/hooks/queries/use-user-stats";
import { cn } from "@/lib/utils";
import { normalizeRole } from "@/lib/routes";
import { ParentHomeOverview } from "@/components/parent";

const MAX_ENROLLED_SHOWN = 8;
const MAX_RECOMMENDED = 8;

function SectionHeader({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="text-h3 text-slate-900 dark:text-slate-50">{title}</h2>
      {href && linkLabel && (
        <Link href={href} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "shrink-0")}>
          {linkLabel}
          <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

function CourseGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4 2xl:grid-cols-5">{children}</div>;
}

function ContinueSkeleton() {
  return (
    <Card className="overflow-hidden rounded-3xl md:flex lg:col-span-2">
      <Skeleton className="aspect-video w-full rounded-none md:w-72" />
      <div className="flex-1 space-y-4 p-4 md:p-5 lg:p-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-2.5 w-full" />
        <Skeleton className="h-12 w-40 rounded-lg" />
      </div>
    </Card>
  );
}

/**
 * Nội dung `/home` cho vai HỌC SINH. Auth/hydration guard + rẽ nhánh role nằm ở
 * `HomePage` bên dưới, nên component này chỉ render khi đã chắc chắn đăng nhập.
 */
function StudentHomeContent() {
  const { user } = useAuthStore();
  const { data: enrolledCourses = [], isLoading } = useEnrolledCourses();
  const { data: schedules = [] } = useMySchedules();
  const { data: featuredCourses = [] } = useFeaturedCourses();
  const { data: profile } = usePublicProfile(user?.id ? String(user.id) : "");

  const sorted = useMemo(
    () =>
      [...enrolledCourses].sort((a, b) => {
        const aT = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0;
        const bT = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0;
        return bT - aT;
      }),
    [enrolledCourses]
  );
  const featured = sorted[0];
  const otherEnrolled = sorted.slice(1, 1 + MAX_ENROLLED_SHOWN);

  const recommended = useMemo(() => {
    const enrolledIds = new Set(enrolledCourses.map((c) => String(c.id)));
    return featuredCourses.filter((c) => !enrolledIds.has(String(c.id))).slice(0, MAX_RECOMMENDED);
  }, [enrolledCourses, featuredCourses]);

  const todayItems = useMemo(() => buildTodaySchedule(schedules || []), [schedules]);

  const stats = profile?.stats;
  const currentStreak = stats?.current_streak ?? 0;
  const hasStreakToday = profile?.activity?.some(
    (a) => a.date.slice(0, 10) === new Date().toLocaleDateString("sv-SE") && a.count > 0
  ) ?? false;

  return (
    <div className="page-container space-y-8 py-6 md:space-y-10 lg:space-y-12 lg:py-8">
      {/* Greeting */}
      <header className="space-y-1">
        <h1 className="text-h1 text-slate-900 dark:text-slate-50">
          {getGreeting()}, {user?.name || "bạn"}
        </h1>
        <p className="text-body-sm text-slate-600 dark:text-slate-400">{formatToday()}</p>
      </header>

      {/* Daily-goal ring (DailyGoalWidget) is intentionally NOT rendered: there is no
          daily-goal API yet, and showing a fake 0/N ring would mislead students. */}
      {/* Continue learning + gamification bento */}
      <section
        aria-label="Tiếp tục học và tiến độ"
        className="grid gap-4 md:gap-5 lg:grid-cols-3 lg:gap-6"
      >
        {isLoading ? (
          <ContinueSkeleton />
        ) : featured ? (
          <ContinueLearningCard
            className="lg:col-span-2"
            course={{
              slug: featured.slug,
              title: featured.title,
              thumbnail: featured.thumbnail,
              category: featured.category?.name,
              completedLessons: featured.completedLessons,
              totalLessons: featured.totalLessons || featured.lessonCount,
              progress: featured.progress,
            }}
          />
        ) : (
          <Card className="rounded-3xl lg:col-span-2">
            <EmptyState
              icon={BookOpen}
              title="Bạn chưa đăng ký khóa học nào"
              description="Chọn một khóa học để bắt đầu lộ trình học của bạn."
              action={
                <Link href="/courses" className={buttonVariants({ size: "lg" })}>
                  Khám phá khóa học
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              }
              className="min-h-[240px]"
            />
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-1 lg:gap-4">
          <StreakCard
            currentStreak={currentStreak}
            longestStreak={stats?.longest_streak ?? 0}
            hasStreakToday={hasStreakToday}
          />
          <XPProgressCard
            totalXP={stats?.total_points ?? 0}
            level={stats?.level ?? 1}
            progress={stats?.level_progress ?? 0}
          />
        </div>
      </section>

      {/* In-progress courses */}
      {otherEnrolled.length > 0 && (
        <section>
          <SectionHeader title="Khóa học đang học" href="/my-courses" linkLabel="Xem tất cả" />
          <CourseGrid>
            {otherEnrolled.map((c) => (
              <CourseCard key={String(c.id)} course={c} />
            ))}
          </CourseGrid>
        </section>
      )}

      {/* Today's schedule */}
      <section>
        <SectionHeader title="Lịch học hôm nay" href="/schedule" linkLabel="Xem lịch" />
        <TodaySchedule items={todayItems} />
      </section>

      {/* Recommendations */}
      {recommended.length > 0 && (
        <section>
          <SectionHeader title="Gợi ý cho bạn" href="/courses" linkLabel="Khám phá thêm" />
          <CourseGrid>
            {recommended.map((c) => (
              <CourseCard key={String(c.id)} course={c} />
            ))}
          </CourseGrid>
        </section>
      )}
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated, activeRole } = useAuthStore();

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push("/");
    }
  }, [hasHydrated, isAuthenticated, router]);

  // Wait for hydration and auth check
  if (!hasHydrated || !isAuthenticated) return null;

  // QA 260927 P1: `/home` của phụ huynh trước đây render nguyên dashboard học
  // sinh (0 khoá, 0% tiến độ...) — rẽ nhánh sớm để phụ huynh không gọi các
  // hook chỉ có ý nghĩa cho học sinh (enrollments/schedules của CHÍNH họ).
  if (normalizeRole(activeRole) === "PARENT") {
    return <ParentHomeOverview />;
  }

  return <StudentHomeContent />;
}
