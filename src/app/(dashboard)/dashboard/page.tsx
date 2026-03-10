"use client";

import Link from "next/link";
import { BookOpen, Trophy, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useMe } from "@/hooks/queries/use-auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  StreakCard,
  XPProgressCard,
  ContinueLearningCard,
  DailyGoalWidget,
} from "@/components/dashboard";

// Mock data - replace with API calls
const mockContinueCourse = {
  id: "course-1",
  title: "Mathematics Fundamentals",
  thumbnail: "",
  currentLesson: 5,
  totalLessons: 12,
  progress: 42,
  estimatedTime: 15,
};

const mockCourses = [
  { id: "1", title: "Math 101", progress: 65, thumbnail: "" },
  { id: "2", title: "English Basic", progress: 100, thumbnail: "" },
  { id: "3", title: "Physics", progress: 25, thumbnail: "" },
];

export default function DashboardPage() {
  const { activeRole } = useAuthStore();
  const { data: meData } = useMe();

  const userName = meData?.user?.name || "Student";

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
        {/* Streak Card */}
        <StreakCard
          currentStreak={14}
          longestStreak={21}
          hasStreakToday={true}
          className="md:col-span-1"
        />

        {/* XP Progress */}
        <XPProgressCard
          currentXP={2450}
          levelXP={3000}
          level={12}
          className="md:col-span-1"
        />

        {/* Continue Learning - spans 2 cols on larger screens */}
        <ContinueLearningCard
          course={mockContinueCourse}
          className="md:col-span-2"
        />
      </div>

      {/* Daily Goal */}
      <DailyGoalWidget completed={2} target={3} bonusXP={50} />

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
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2">
            {mockCourses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="flex-shrink-0 w-48 p-4 rounded-lg border bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
              >
                <div className="w-full h-24 rounded-lg bg-gradient-to-br from-primary-400 to-secondary-500 mb-3" />
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
            <Badge variant="bronze">#3 Bronze</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              You moved up 2 positions this week!
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
            <Badge variant="achievement">12 earned</Badge>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-3">
              {["First Steps", "Week Warrior", "Quiz Master"].map((name, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white text-xs"
                  title={name}
                >
                  {i + 1}
                </div>
              ))}
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-muted-foreground text-xs">
                +9
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/achievements">View All</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
