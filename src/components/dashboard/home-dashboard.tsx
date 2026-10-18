"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Award,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Flame,
  GraduationCap,
  LayoutGrid,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth.store";
import { useEnrolledCourses, useFeaturedCourses } from "@/hooks/use-courses";
import { useMySchedules } from "@/hooks/queries/use-class-schedule";
import { usePublicProfile } from "@/hooks/queries/use-user-stats";
import { formatLessonProgress } from "@/lib/lesson-progress-label";
import { cn } from "@/lib/utils";
import { buildTodaySchedule } from "./today-schedule";
import { StreakCard } from "./streak-card";
import { XPProgressCard } from "./xp-progress-card";
import { formatToday, getGreeting } from "./greeting";
import {
  DEFAULT_HOME_LAYOUT,
  HOME_WIDGETS,
  readHomeLayout,
  type HomeWidgetId,
} from "./home-widget-layout";

const ICONS: Record<HomeWidgetId, LucideIcon> = {
  continue: BookOpen,
  activity: Activity,
  overview: GraduationCap,
  streak: Flame,
  xp: Star,
  schedule: CalendarDays,
  shortcuts: LayoutGrid,
  courses: BookOpen,
  recommended: Sparkles,
};

const SHORTCUTS = [
  { title: "Khoá học", description: "Không gian học của bạn", href: "/my-courses", icon: BookOpen },
  { title: "Trợ lý AI", description: "Cùng giải đáp thắc mắc", href: "/ai-chat", icon: Sparkles },
  { title: "Cuộc thi", description: "Thử sức và tiến bộ", href: "/contests", icon: Trophy },
  { title: "Chứng chỉ", description: "Ghi dấu thành tích", href: "/certificates", icon: Award },
];

function Widget({
  id,
  children,
  href,
  action,
}: {
  id: HomeWidgetId;
  children: ReactNode;
  href?: string;
  action?: string;
}) {
  const widget = HOME_WIDGETS.find((item) => item.id === id)!;
  const Icon = ICONS[id];
  return (
    <Card className={cn("flex min-w-0 flex-col overflow-hidden", widget.width)}>
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary",
              id === "streak" &&
                "bg-orange-50 text-streak dark:bg-orange-950 dark:text-streak-light"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <h2 className="text-sm font-semibold text-foreground">{widget.title}</h2>
        </div>
        {href && (
          <Link
            href={href}
            className="flex shrink-0 items-center gap-1 rounded-lg text-xs font-medium text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {action || "Xem tất cả"}
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">{children}</div>
    </Card>
  );
}

function QueryContent({
  loading,
  error,
  retry,
  children,
}: {
  loading: boolean;
  error: boolean;
  retry: () => void;
  children: ReactNode;
}) {
  if (loading)
    return (
      <div className="space-y-4 py-3" role="status" aria-label="Đang tải dữ liệu">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  if (error)
    return (
      <div
        role="alert"
        className="flex min-h-32 flex-1 flex-col items-center justify-center gap-3 text-center"
      >
        <p className="text-sm text-muted-foreground">Chưa tải được dữ liệu. Vui lòng thử lại.</p>
        <Button variant="outline" size="sm" onClick={retry}>
          Thử lại
        </Button>
      </div>
    );
  return <>{children}</>;
}

function EmptyWidget({
  children,
  href,
  label,
}: {
  children: ReactNode;
  href: string;
  label: string;
}) {
  return (
    <div className="flex min-h-36 flex-1 flex-col items-center justify-center gap-3 rounded-xl bg-muted/50 p-5 text-center">
      <p className="max-w-xs text-sm text-muted-foreground">{children}</p>
      <Link href={href} className={buttonVariants({ variant: "secondary", size: "sm" })}>
        {label}
        <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

export function HomeDashboard() {
  const user = useAuthStore((state) => state.user);
  const enrolled = useEnrolledCourses();
  const schedule = useMySchedules();
  const featured = useFeaturedCourses();
  const profile = usePublicProfile(user?.id ? String(user.id) : "");
  const [layout, setLayout] = useState<HomeWidgetId[]>([...DEFAULT_HOME_LAYOUT]);
  const [draft, setDraft] = useState<HomeWidgetId[]>([]);
  const [customizing, setCustomizing] = useState(false);
  const storageKey = `fortex:home-widgets:v1:${user?.id}`;

  useEffect(() => {
    try {
      setLayout(readHomeLayout(localStorage.getItem(storageKey)));
    } catch {
      setLayout([...DEFAULT_HOME_LAYOUT]);
    }
  }, [storageKey]);

  const courses = useMemo(
    () =>
      [...(enrolled.data || [])].sort(
        (a, b) =>
          (Date.parse(b.lastAccessedAt || "") || 0) - (Date.parse(a.lastAccessedAt || "") || 0)
      ),
    [enrolled.data]
  );
  const current = courses.find((course) => course.progress < 100) || courses[0];
  const recommendations = (featured.data || [])
    .filter((course) => !courses.some((enrollment) => String(enrollment.id) === String(course.id)))
    .slice(0, 3);
  const today = buildTodaySchedule(schedule.data || []);
  const stats = profile.data?.stats;
  const activity = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + index);
    const key = date.toLocaleDateString("sv-SE");
    return {
      date,
      count: profile.data?.activity.find((item) => item.date.slice(0, 10) === key)?.count || 0,
    };
  });
  const totalActivity = activity.reduce((sum, day) => sum + day.count, 0);
  const maxActivity = Math.max(1, ...activity.map((day) => day.count));
  const openCustomization = () => {
    setDraft([...layout]);
    setCustomizing(true);
  };
  function saveLayout() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(draft));
      setLayout([...draft]);
      setCustomizing(false);
      toast.success("Đã lưu bố cục trang chủ");
    } catch {
      toast.error("Chưa lưu được bố cục. Vui lòng thử lại.");
    }
  }
  function moveWidget(index: number, direction: -1 | 1) {
    setDraft((items) => {
      const next = [...items];
      [next[index], next[index + direction]] = [next[index + direction], next[index]];
      return next;
    });
  }
  const enrolledContent = (children: ReactNode) => (
    <QueryContent
      loading={enrolled.isLoading}
      error={enrolled.isError}
      retry={() => void enrolled.refetch()}
    >
      {children}
    </QueryContent>
  );
  const profileContent = (children: ReactNode) => (
    <QueryContent
      loading={profile.isLoading}
      error={profile.isError}
      retry={() => void profile.refetch()}
    >
      {children}
    </QueryContent>
  );

  function renderWidget(id: HomeWidgetId) {
    switch (id) {
      case "continue":
        return (
          <Widget key={id} id={id} href="/my-courses" action="Khoá học của tôi">
            {enrolledContent(
              current ? (
                <>
                  <div className="flex items-start gap-4">
                    <div className="flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-primary sm:h-24 sm:w-32">
                      {current.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={current.thumbnail}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <BookOpen className="h-8 w-8" aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="mb-1 text-xs font-medium text-primary">
                        {current.category?.name}
                      </p>
                      <h3 className="line-clamp-2 text-lg font-semibold leading-snug">
                        {current.title}
                      </h3>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatLessonProgress(
                          current.completedLessons,
                          current.totalLessons || current.lessonCount
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="mb-4 mt-5">
                    <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                      <span>Tiến độ khoá học</span>
                      <span className="font-semibold tabular-nums text-primary">
                        {Math.round(current.progress)}%
                      </span>
                    </div>
                    <ProgressBar value={current.progress} size="sm" />
                  </div>
                  <Link
                    href={`/courses/${current.slug}/learn`}
                    className={cn(buttonVariants({ size: "sm" }), "mt-auto self-start")}
                  >
                    Tiếp tục học
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </>
              ) : (
                <EmptyWidget href="/courses" label="Khám phá khoá học">
                  Bắt đầu hành trình của bạn với một khoá học mới.
                </EmptyWidget>
              )
            )}
          </Widget>
        );
      case "activity":
        return (
          <Widget key={id} id={id}>
            {profileContent(
              <>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-3xl font-semibold tabular-nums">
                      {totalActivity.toLocaleString("vi-VN")}
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        hoạt động
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Mỗi bước nhỏ đều là một sự tiến bộ.
                    </p>
                  </div>
                  <span className="shrink-0 rounded-pill bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                    7 ngày qua
                  </span>
                </div>
                <div
                  className="mt-5 flex h-32 items-end gap-3 border-b border-border pb-2"
                  role="img"
                  aria-label={`Hoạt động 7 ngày qua: ${activity.map((day) => `${day.date.toLocaleDateString("vi-VN")}: ${day.count}`).join(", ")}`}
                >
                  {activity.map((day, index) => (
                    <div
                      key={index}
                      className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                    >
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {day.count}
                      </span>
                      <div
                        className={cn(
                          "w-full max-w-10 rounded-t-md",
                          index === 6 ? "bg-primary" : "bg-primary/20"
                        )}
                        style={{
                          height: `${day.count ? Math.max(8, (day.count / maxActivity) * 80) : 3}px`,
                        }}
                      />
                      <span
                        className={cn(
                          "text-xs",
                          index === 6 ? "font-semibold text-primary" : "text-muted-foreground"
                        )}
                      >
                        {index === 6
                          ? "Nay"
                          : day.date.toLocaleDateString("vi-VN", { weekday: "short" })}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Widget>
        );
      case "overview":
        return (
          <Widget key={id} id={id} href="/profile" action="Hồ sơ">
            {enrolledContent(
              profileContent(
                <div className="grid flex-1 grid-cols-2 gap-4">
                  {[
                    {
                      value: courses.filter((course) => course.progress < 100).length,
                      label: "Khoá đang học",
                    },
                    {
                      value: courses.filter((course) => course.progress >= 100).length,
                      label: "Khoá hoàn thành",
                    },
                    { value: stats?.lessons_completed || 0, label: "Bài đã hoàn thành" },
                    { value: stats?.achievement_count || 0, label: "Thành tích" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-muted/60 p-3">
                      <p className="text-2xl font-semibold tabular-nums">{item.value}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
                    </div>
                  ))}
                </div>
              )
            )}
          </Widget>
        );
      case "streak":
        return (
          <Widget key={id} id={id}>
            {profileContent(
              <StreakCard
                currentStreak={stats?.current_streak || 0}
                longestStreak={stats?.longest_streak || 0}
                hasStreakToday={activity[6].count > 0}
                className="h-full border-0 p-0 shadow-none md:p-0"
              />
            )}
          </Widget>
        );
      case "xp":
        return (
          <Widget key={id} id={id}>
            {profileContent(
              <>
                <p className="mb-4 text-sm text-muted-foreground">
                  Tích luỹ kiến thức, mở thêm cột mốc.
                </p>
                <XPProgressCard
                  totalXP={stats?.total_points || 0}
                  level={stats?.level || 1}
                  progress={stats?.level_progress || 0}
                  className="border-0 p-0 shadow-none md:p-0"
                />
                <Link href="/leaderboard" className="mt-auto pt-5 text-xs font-medium text-primary">
                  Xem bảng xếp hạng{" "}
                  <ArrowRight className="ml-1 inline h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </>
            )}
          </Widget>
        );
      case "schedule":
        return (
          <Widget key={id} id={id} href="/schedule" action="Mở lịch">
            <QueryContent
              loading={schedule.isLoading}
              error={schedule.isError}
              retry={() => void schedule.refetch()}
            >
              {today.length ? (
                <ul className="divide-y divide-border">
                  {today.map((item) => (
                    <li key={item.id}>
                      <Link
                        href="/schedule"
                        className="flex items-start gap-4 rounded-lg py-3 hover:bg-muted/50"
                      >
                        <div className="w-14 shrink-0 text-sm font-semibold tabular-nums">
                          {item.start}
                          <p className="text-xs font-normal text-muted-foreground">{item.end}</p>
                        </div>
                        <span className="mt-1 h-9 w-0.5 shrink-0 rounded-pill bg-primary/40" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.room || "Buổi học"} ·{" "}
                            {item.status === "done"
                              ? "Đã xong"
                              : item.status === "ongoing"
                                ? "Đang diễn ra"
                                : "Sắp diễn ra"}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyWidget href="/schedule" label="Xem lịch học">
                  Hôm nay bạn không có lịch học. Dành chút thời gian ôn lại kiến thức nhé.
                </EmptyWidget>
              )}
            </QueryContent>
          </Widget>
        );
      case "shortcuts":
        return (
          <Widget key={id} id={id}>
            <div className="grid flex-1 grid-cols-2 gap-3">
              {SHORTCUTS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex flex-col items-start gap-2 rounded-xl border border-border p-3 transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <item.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <span className="text-sm font-medium">{item.title}</span>
                  <span className="text-xs text-muted-foreground">{item.description}</span>
                </Link>
              ))}
            </div>
          </Widget>
        );
      case "courses":
        return (
          <Widget key={id} id={id} href="/my-courses">
            {enrolledContent(
              courses.length ? (
                <ul className="divide-y divide-border">
                  {courses.slice(0, 3).map((course) => (
                    <li key={String(course.id)}>
                      <Link
                        href={`/courses/${course.slug}/learn`}
                        className="flex items-center gap-3 rounded-lg py-3 hover:bg-muted/50"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                          {course.progress >= 100 ? (
                            <Check className="h-5 w-5" />
                          ) : (
                            <BookOpen className="h-5 w-5" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{course.title}</p>
                          <ProgressBar value={course.progress} size="sm" className="mt-2" />
                        </div>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {Math.round(course.progress)}%
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyWidget href="/courses" label="Tìm khoá học">
                  Các khoá học bạn đăng ký sẽ xuất hiện tại đây.
                </EmptyWidget>
              )
            )}
          </Widget>
        );
      case "recommended":
        return (
          <Widget key={id} id={id} href="/courses" action="Khám phá">
            <QueryContent
              loading={featured.isLoading || enrolled.isLoading}
              error={featured.isError || enrolled.isError}
              retry={() => {
                if (featured.isError) void featured.refetch();
                if (enrolled.isError) void enrolled.refetch();
              }}
            >
              {recommendations.length ? (
                <ul className="divide-y divide-border">
                  {recommendations.map((course) => (
                    <li key={String(course.id)}>
                      <Link
                        href={`/courses/${course.slug}`}
                        className="flex items-center gap-3 rounded-lg py-3 hover:bg-muted/50"
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-primary">
                          {course.thumbnail ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={course.thumbnail}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <GraduationCap className="h-5 w-5" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{course.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {course.instructor.name} · {course.lessonCount} bài học
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyWidget href="/courses" label="Khám phá khoá học">
                  Tìm thêm chủ đề mới để phát triển mỗi ngày.
                </EmptyWidget>
              )}
            </QueryContent>
          </Widget>
        );
    }
  }

  return (
    <div className="page-container space-y-6 py-6 lg:py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            {formatToday()}
          </p>
          <h1 className="text-h1">
            {getGreeting()}, {user?.name || "bạn"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Một ngày mới, thêm một bước tiến trên hành trình học tập.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={openCustomization}>
          <SlidersHorizontal className="mr-2 h-4 w-4" aria-hidden="true" />
          Tuỳ chỉnh trang chủ
        </Button>
      </header>
      <div className="flex flex-wrap gap-2" aria-label="Tóm tắt học tập">
        <span className="inline-flex items-center gap-2 rounded-pill border border-border bg-card px-3 py-1.5 text-xs">
          <BookOpen className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          {enrolled.isLoading || enrolled.isError
            ? "Khoá học của bạn"
            : `${courses.filter((course) => course.progress < 100).length} khoá đang học`}
        </span>
        <span className="inline-flex items-center gap-2 rounded-pill border border-border bg-card px-3 py-1.5 text-xs">
          <CalendarDays className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          {schedule.isLoading || schedule.isError
            ? "Lịch học hôm nay"
            : `${today.length} buổi học hôm nay`}
        </span>
        <span className="inline-flex items-center gap-2 rounded-pill border border-border bg-card px-3 py-1.5 text-xs">
          <Flame className="h-3.5 w-3.5 text-streak dark:text-streak-light" aria-hidden="true" />
          {profile.isLoading || profile.isError
            ? "Chuỗi ngày học"
            : `${stats?.current_streak || 0} ngày liên tiếp`}
        </span>
      </div>
      <section
        aria-label="Các widget học tập"
        className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5"
      >
        {layout.map(renderWidget)}
        <button
          onClick={openCustomization}
          className="flex min-h-28 items-center justify-center gap-3 rounded-2xl border border-dashed border-input bg-card/50 p-5 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:col-span-12"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-pill bg-primary/10 text-primary">
            <Plus className="h-5 w-5" aria-hidden="true" />
          </span>
          Thêm và sắp xếp widget
        </button>
      </section>
      <Dialog open={customizing} onOpenChange={setCustomizing}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>Không gian học tập của bạn</DialogTitle>
          <DialogDescription>
            Chọn widget và sắp xếp theo cách bạn muốn. Bố cục được lưu trên trình duyệt này.
          </DialogDescription>
          <div className="my-5 max-h-[50vh] space-y-2 overflow-y-auto pr-1">
            {[...draft, ...DEFAULT_HOME_LAYOUT.filter((id) => !draft.includes(id))].map((id) => {
              const widget = HOME_WIDGETS.find((item) => item.id === id)!;
              const Icon = ICONS[id];
              const index = draft.indexOf(id);
              const selected = index !== -1;
              return (
                <div
                  key={id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3",
                    selected ? "border-primary/30 bg-primary/5" : "border-border"
                  )}
                >
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() =>
                        setDraft((items) =>
                          selected ? items.filter((item) => item !== id) : [...items, id]
                        )
                      }
                      className="h-4 w-4 shrink-0 accent-primary"
                    />
                    <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <span>
                      <span className="block text-sm font-medium">{widget.title}</span>
                      <span className="block text-xs text-muted-foreground">
                        {widget.description}
                      </span>
                    </span>
                  </label>
                  {selected && (
                    <div className="flex shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={index === 0}
                        aria-label={`Di chuyển ${widget.title} lên`}
                        onClick={() => moveWidget(index, -1)}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={index === draft.length - 1}
                        aria-label={`Di chuyển ${widget.title} xuống`}
                        onClick={() => moveWidget(index, 1)}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <Button variant="ghost" size="sm" onClick={() => setDraft([...DEFAULT_HOME_LAYOUT])}>
              <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
              Mặc định
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCustomizing(false)}>
                Huỷ
              </Button>
              <Button size="sm" onClick={saveLayout}>
                Lưu bố cục
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
