"use client";

import Link from "next/link";
import { BookOpen, Trophy, ChevronRight, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useMe } from "@/hooks/queries/use-auth";
import { useEnrolledCourses } from "@/hooks/use-courses";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  StreakCard,
  XPProgressCard,
  ContinueLearningCard,
  DailyGoalWidget,
} from "@/components/dashboard";

// TODO: wire up gamification API (streaks, XP, daily goals) when backend endpoint is available
const GAMIFICATION_DEFAULTS = {
  currentStreak: 0,
  longestStreak: 0,
  hasStreakToday: false,
  currentXP: 0,
  levelXP: 500,
  level: 1,
  dailyCompleted: 0,
  dailyTarget: 3,
  bonusXP: 50,
} as const;

export default function DashboardPage() {
  const { activeRole } = useAuthStore();
  const { data: meData } = useMe();
  const { data: enrolledCourses, isLoading: coursesLoading } =
    useEnrolledCourses();

  const userName = meData?.user?.name || "Student";

  // Map first enrolled course to ContinueLearningCard shape
  const firstCourse = enrolledCourses?.[0] ?? null;
  const continueCourse = firstCourse
    ? {
        id: String(firstCourse.id),
        title: firstCourse.title,
        thumbnail: firstCourse.thumbnail,
        currentLesson: firstCourse.completedLessons + 1,
        totalLessons: firstCourse.totalLessons,
        progress: firstCourse.progress,
      }
    : null;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {userName}!
          </h1>
          <p className="text-muted-foreground">
            Keep up the great work today.
          </p>
        </div>
        <Badge variant="level" className="hidden sm:flex">
          {activeRole || "Student"}
        </Badge>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Streak Card — defaults to 0 until gamification API is wired up */}
        <StreakCard
          currentStreak={GAMIFICATION_DEFAULTS.currentStreak}
          longestStreak={GAMIFICATION_DEFAULTS.longestStreak}
          hasStreakToday={GAMIFICATION_DEFAULTS.hasStreakToday}
          className="md:col-span-1"
        />

        {/* XP Progress — defaults to level 1 / 0 XP until gamification API is wired up */}
        <XPProgressCard
          currentXP={GAMIFICATION_DEFAULTS.currentXP}
          levelXP={GAMIFICATION_DEFAULTS.levelXP}
          level={GAMIFICATION_DEFAULTS.level}
          className="md:col-span-1"
        />

        {/* Continue Learning - spans 2 cols on larger screens */}
        <div className="md:col-span-2">
          {coursesLoading ? (
            <Card className="p-4 flex items-center justify-center h-full min-h-[120px]">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </Card>
          ) : continueCourse ? (
            <ContinueLearningCard course={continueCourse} className="h-full" />
          ) : (
            <Card className="p-4 flex flex-col items-center justify-center h-full min-h-[120px] text-center">
              <BookOpen className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Chưa có khóa học nào đang học.
              </p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link href="/courses">Khám phá khóa học</Link>
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Daily Goal — defaults to 0 completed until gamification API is wired up */}
      <DailyGoalWidget
        completed={GAMIFICATION_DEFAULTS.dailyCompleted}
        target={GAMIFICATION_DEFAULTS.dailyTarget}
        bonusXP={GAMIFICATION_DEFAULTS.bonusXP}
      />

      {/* My Courses Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            My Courses
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/courses" className="flex items-center gap-1">
              View All
              <ChevronRight className="w-4 h-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {coursesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : enrolledCourses && enrolledCourses.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2">
              {enrolledCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.slug}`}
                  className="flex-shrink-0 w-48 p-4 rounded-lg border bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
                >
                  <div className="w-full h-24 rounded-lg bg-gradient-to-br from-primary-400 to-secondary-500 mb-3 overflow-hidden">
                    {course.thumbnail && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <h4 className="font-medium text-sm truncate">{course.title}</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {course.progress}%
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BookOpen className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-3">
                Chưa có khóa học nào. Hãy bắt đầu học ngay!
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/courses">Khám phá khóa học</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leaderboard & Achievements Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Leaderboard Preview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Leaderboard
            </CardTitle>
            <Badge variant="bronze">#—</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Hoàn thành bài học để leo hạng!
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/leaderboard">View Leaderboard</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Achievements Preview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Achievements</CardTitle>
            <Badge variant="achievement">0 earned</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Hoàn thành bài học để mở khoá thành tích!
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/achievements">View All</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
