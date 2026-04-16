"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2, ChevronLeft, ChevronRight, BookOpen, Play, Trophy, Flame, Target,
  ArrowRight, Calendar as CalendarIcon, Clock, BarChart3,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { useEnrolledCourses } from "@/hooks/use-courses";
import { useMySchedules } from "@/hooks/queries/use-class-schedule";
import type { ClassSchedule } from "@/types/class-schedule";

// ─── Activity Chart ─────────────────────────────────────────────────────────

function ActivityChart({ schedules }: { schedules: ClassSchedule[] }) {
  // Calculate study hours per day of the week from recurring schedules
  const dayLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  const dayHours = useMemo(() => {
    const hours = [0, 0, 0, 0, 0, 0, 0]; // Mon=0..Sun=6
    schedules.forEach((s) => {
      const [sh, sm] = s.start_time.split(":").map(Number);
      const [eh, em] = s.end_time.split(":").map(Number);
      const dur = (eh - sh) + (em - sm) / 60;
      // Convert JS day (0=Sun) to Mon=0 index
      const idx = s.day_of_week === 0 ? 6 : s.day_of_week - 1;
      hours[idx] += dur;
    });
    return hours;
  }, [schedules]);

  const maxH = Math.max(...dayHours, 1);
  const totalWeek = dayHours.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-800">Hoạt động tuần</h3>
        </div>
        <span className="text-xs text-gray-500">{Math.round(totalWeek * 10) / 10}h tổng</span>
      </div>
      <div className="flex items-end gap-1.5 h-20">
        {dayHours.map((h, i) => {
          const pct = maxH > 0 ? (h / maxH) * 100 : 0;
          const isToday = ((new Date().getDay() + 6) % 7) === i;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full relative" style={{ height: "60px" }}>
                <div
                  className={cn(
                    "absolute bottom-0 w-full rounded-t-md transition-all",
                    isToday ? "bg-blue-500" : "bg-blue-200",
                  )}
                  style={{ height: `${Math.max(pct, 4)}%` }}
                />
              </div>
              <span className={cn("text-[9px] font-medium", isToday ? "text-blue-600" : "text-gray-400")}>
                {dayLabels[i]}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[10px] text-gray-400">
        <span>0h</span>
        <span>{Math.ceil(maxH)}h</span>
      </div>
    </div>
  );
}

// ─── Mini Calendar ──────────────────────────────────────────────────────────

const WEEKDAYS_VN = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const MONTHS_VN = [
  "Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6",
  "Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12",
];

function MiniCalendar({ schedules }: { schedules: ClassSchedule[] }) {
  const [viewDate, setViewDate] = useState(new Date());
  const today = new Date();
  const y = viewDate.getFullYear(), m = viewDate.getMonth();
  const dim = new Date(y, m + 1, 0).getDate();
  const fi = (new Date(y, m, 1).getDay() + 6) % 7;
  const isCur = today.getFullYear() === y && today.getMonth() === m;

  const cells = useMemo(() => {
    const a: (number | null)[] = [];
    for (let i = 0; i < fi; i++) a.push(null);
    for (let d = 1; d <= dim; d++) a.push(d);
    return a;
  }, [fi, dim]);

  // Build set of days that have scheduled classes
  const scheduledDays = useMemo(() => {
    const s = new Set<number>();
    for (let day = 1; day <= dim; day++) {
      const dow = new Date(y, m, day).getDay();
      if (schedules.some(sc => sc.day_of_week === dow)) {
        s.add(day);
      }
    }
    return s;
  }, [schedules, y, m, dim]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">{MONTHS_VN[m]} {y}</h3>
        <div className="flex gap-1">
          <button onClick={() => setViewDate(new Date(y, m - 1, 1))} className="p-1 rounded-md hover:bg-gray-100">
            <ChevronLeft className="h-4 w-4 text-gray-500" />
          </button>
          <button onClick={() => setViewDate(new Date(y, m + 1, 1))} className="p-1 rounded-md hover:bg-gray-100">
            <ChevronRight className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS_VN.map(d => <div key={d} className="text-[10px] font-semibold text-gray-400 py-1">{d}</div>)}
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />;
          const isToday = isCur && day === today.getDate();
          const hasClass = scheduledDays.has(day);
          return (
            <Link key={i} href="/schedule" className={cn(
              "relative mx-auto w-8 h-8 flex items-center justify-center rounded-full text-xs transition-colors",
              isToday && "bg-blue-600 text-white font-bold shadow-sm",
              !isToday && "text-gray-700 hover:bg-gray-100",
            )}>
              {day}
              {hasClass && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400" />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── Upcoming Events (from real schedule data) ──────────────────────────────

interface UpcomingItem {
  id: string;
  time: string;
  endTime: string;
  title: string;
  room?: string;
  dayLabel: string;
  color: string;
  borderColor: string;
  textColor: string;
}

function buildUpcoming(schedules: ClassSchedule[]): UpcomingItem[] {
  const now = new Date();
  const results: UpcomingItem[] = [];
  const colors = [
    { color: "bg-blue-50", borderColor: "border-blue-200", textColor: "text-blue-700" },
    { color: "bg-emerald-50", borderColor: "border-emerald-200", textColor: "text-emerald-700" },
    { color: "bg-violet-50", borderColor: "border-violet-200", textColor: "text-violet-700" },
    { color: "bg-rose-50", borderColor: "border-rose-200", textColor: "text-rose-700" },
  ];

  // Generate upcoming 7 days of events
  for (let offset = 0; offset < 7; offset++) {
    const date = new Date(now);
    date.setDate(now.getDate() + offset);
    const dow = date.getDay();
    const dayLabel = date.toLocaleDateString("vi-VN", { weekday: "short" });

    schedules.forEach((s, idx) => {
      if (s.day_of_week !== dow) return;
      const [sh, sm] = s.start_time.split(":").map(Number);
      const [eh, em] = s.end_time.split(":").map(Number);

      // Skip past events today
      if (offset === 0) {
        const endDate = new Date(date);
        endDate.setHours(eh, em);
        if (endDate < now) return;
      }

      const c = colors[idx % colors.length];
      results.push({
        id: `${s.id}-${offset}`,
        time: `${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}`,
        endTime: `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`,
        title: s.title || "Buổi học",
        room: s.room,
        dayLabel: offset === 0 ? "Hôm nay" : offset === 1 ? "Ngày mai" : dayLabel,
        ...c,
      });
    });
  }

  return results.slice(0, 6);
}

function UpcomingTimeline({ items }: { items: UpcomingItem[] }) {
  if (items.length === 0) {
    return <p className="text-center py-6 text-sm text-gray-400">Không có lịch sắp tới</p>;
  }

  let lastDay = "";
  return (
    <div className="space-y-1.5">
      {items.map(ev => {
        const showDay = ev.dayLabel !== lastDay;
        lastDay = ev.dayLabel;
        return (
          <div key={ev.id}>
            {showDay && <p className="text-[10px] font-semibold text-gray-400 uppercase mt-2 mb-1">{ev.dayLabel}</p>}
            <Link href="/schedule" className={cn("flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors hover:shadow-sm", ev.color, ev.borderColor)}>
              <div className="text-center shrink-0 w-10">
                <p className={cn("text-xs font-bold", ev.textColor)}>{ev.time}</p>
                <p className="text-[9px] text-gray-400">{ev.endTime}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium truncate", ev.textColor)}>{ev.title}</p>
                {ev.room && <p className="text-[10px] text-gray-500 truncate">{ev.room}</p>}
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
}

// ─── Course Card ────────────────────────────────────────────────────────────

function CourseCard({ course }: { course: { id: string; slug: string; title: string; thumbnail?: string; progress: number; category?: string; completedLessons?: number; totalLessons?: number } }) {
  return (
    <Link href={`/courses/${course.slug}`} className="block h-full">
      <Card className="group overflow-hidden hover:shadow-md transition-all border border-gray-100 bg-white h-full flex flex-col">
        <div className="relative aspect-[16/10] overflow-hidden bg-gray-100 shrink-0">
          {course.thumbnail ? (
            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><BookOpen className="h-8 w-8 text-gray-300" /></div>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
            <div className="h-full bg-blue-500 rounded-r-full" style={{ width: `${course.progress}%` }} />
          </div>
        </div>
        <div className="p-3 space-y-1.5 flex-1 flex flex-col">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{course.category || "KHOA HOC"}</span>
          <h3 className="text-sm font-semibold line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors flex-1">{course.title || "Chưa có tiêu đề"}</h3>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{course.completedLessons ?? 0}/{course.totalLessons ?? 0} bài</span>
            <span className="font-bold text-blue-600">{course.progress}%</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Flame; label: string; value: string | number; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white border border-gray-100 p-3.5">
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-none">{value}</p>
        <p className="text-[11px] text-gray-500 mt-0.5 truncate">{label}</p>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated, user } = useAuthStore();
  const { data: enrolledCourses = [], isLoading } = useEnrolledCourses();
  const { data: schedules = [] } = useMySchedules();

  // Calculate total study hours this week from schedules (must be before early return)
  const weeklyHours = useMemo(() => {
    let total = 0;
    (schedules || []).forEach((s: ClassSchedule) => {
      const [sh, sm] = s.start_time.split(":").map(Number);
      const [eh, em] = s.end_time.split(":").map(Number);
      total += (eh - sh) + (em - sm) / 60;
    });
    return Math.round(total * 10) / 10;
  }, [schedules]);

  const upcoming = useMemo(() => buildUpcoming(schedules || []), [schedules]);

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push("/");
    }
  }, [hasHydrated, isAuthenticated, router]);

  // Wait for hydration and auth check
  if (!hasHydrated || !isAuthenticated) return null;

  const sorted = [...enrolledCourses].sort((a, b) => {
    const aT = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0;
    const bT = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0;
    return bT - aT;
  });
  const featured = sorted[0];
  const avgProgress = enrolledCourses.length > 0
    ? Math.round(enrolledCourses.reduce((s, c) => s + c.progress, 0) / enrolledCourses.length) : 0;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Chào buổi sáng";
    if (h < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  })();

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-5 space-y-5">

        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 text-white px-6 py-7 lg:px-8 lg:py-8">
          <div className="relative z-10 flex items-center justify-between gap-6">
            <div className="space-y-1.5">
              <p className="text-sm text-slate-300">{greeting}, {user?.name || "bạn"}</p>
              <h1 className="text-xl lg:text-2xl font-bold leading-snug">
                Hành động hôm nay<br />quyết định tương lai bạn
              </h1>
              {featured && (
                <Link href={`/courses/${featured.slug}`}>
                  <Button size="sm" className="mt-3 bg-white text-slate-900 hover:bg-white/90 font-semibold text-xs">
                    <Play className="h-3.5 w-3.5 mr-1.5 fill-current" /> Tiếp tục học
                  </Button>
                </Link>
              )}
            </div>
            <Avatar src={user?.avatar} fallback={(user?.name || "U")[0]} size="xl" className="hidden lg:block" />
          </div>
          <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-white/[0.03]" />
          <div className="absolute -right-6 -bottom-14 w-36 h-36 rounded-full bg-white/[0.03]" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={BookOpen} label="Khóa học" value={enrolledCourses.length} color="bg-blue-50 text-blue-600" />
          <StatCard icon={Target} label="Tiến độ TB" value={`${avgProgress}%`} color="bg-emerald-50 text-emerald-600" />
          <StatCard icon={Clock} label="Giờ học/tuần" value={`${weeklyHours}h`} color="bg-orange-50 text-orange-500" />
          <StatCard icon={Trophy} label="Thành tích" value="--" color="bg-violet-50 text-violet-600" />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Left: Courses (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {/* Featured */}
            {featured && (
              <section>
                <div className="flex items-center justify-between mb-2.5">
                  <h2 className="text-sm font-semibold text-gray-800">Đang học gần đây</h2>
                  <Link href="/my-courses" className="text-xs text-blue-600 font-medium hover:underline">Xem tất cả</Link>
                </div>
                <Link href={`/courses/${featured.slug}`} className="block">
                  <Card className="group overflow-hidden hover:shadow-md transition-all border border-gray-100 bg-white">
                    <div className="flex flex-col sm:flex-row">
                      <div className="sm:w-52 h-36 sm:h-auto overflow-hidden bg-gray-100 shrink-0">
                        {featured.thumbnail ? (
                          <img src={featured.thumbnail} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><BookOpen className="h-10 w-10 text-gray-300" /></div>
                        )}
                      </div>
                      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                        <div>
                          <span className="text-[10px] font-semibold text-gray-400 uppercase">{featured.category?.name?.toUpperCase() || "KHOA HOC"}</span>
                          <h3 className="font-semibold mt-1 group-hover:text-blue-600 transition-colors line-clamp-2">{featured.title}</h3>
                          <p className="text-xs text-gray-500 mt-1">{featured.completedLessons ?? 0}/{featured.totalLessons ?? featured.lessonCount ?? 0} bài học</p>
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${featured.progress}%` }} />
                          </div>
                          <span className="text-xs font-bold text-blue-600 shrink-0">{featured.progress}%</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </section>
            )}

            {/* Course grid */}
            <section>
              <h2 className="text-sm font-semibold text-gray-800 mb-2.5">Khóa học của tôi</h2>
              {isLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
              ) : enrolledCourses.length === 0 ? (
                <Card className="p-10 text-center bg-white border border-gray-100">
                  <BookOpen className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 text-sm mb-3">Bạn chưa đăng ký khóa học nào</p>
                  <Link href="/courses"><Button variant="outline" size="sm">Khám phá khóa học <ArrowRight className="h-3.5 w-3.5 ml-1" /></Button></Link>
                </Card>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {enrolledCourses.map(c => (
                    <CourseCard key={String(c.id)} course={{
                      id: String(c.id), slug: c.slug, title: c.title, thumbnail: c.thumbnail,
                      progress: c.progress, category: c.category?.name?.toUpperCase(),
                      completedLessons: c.completedLessons, totalLessons: c.totalLessons || c.lessonCount,
                    }} />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Activity Chart */}
            <Card className="p-4 bg-white border border-gray-100">
              <ActivityChart schedules={schedules || []} />
            </Card>

            {/* Calendar */}
            <Card className="p-4 bg-white border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <CalendarIcon className="h-4 w-4 text-blue-600" />
                <h2 className="text-sm font-semibold text-gray-800">Lịch học</h2>
              </div>
              <MiniCalendar schedules={schedules || []} />
            </Card>

            {/* Upcoming */}
            <Card className="p-4 bg-white border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-800">Sắp tới</h2>
                <Link href="/schedule" className="text-[10px] text-blue-600 font-medium hover:underline">Xem lịch</Link>
              </div>
              <UpcomingTimeline items={upcoming} />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
