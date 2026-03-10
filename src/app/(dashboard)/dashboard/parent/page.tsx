"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Flame,
  Clock,
  BookOpen,
  ChevronRight,
  CreditCard,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";

// Mock data - replace with API calls
const mockChildren = [
  {
    id: "child-1",
    name: "Minh",
    avatar: "",
    streak: 14,
    weeklyTime: 225,
    weeklyLessons: 5,
    quizAverage: 85,
  },
  {
    id: "child-2",
    name: "Linh",
    avatar: "",
    streak: 7,
    weeklyTime: 180,
    weeklyLessons: 4,
    quizAverage: 92,
  },
];

const mockCourses = [
  { id: "1", title: "Math 101", progress: 65, lastActivity: "Yesterday" },
  { id: "2", title: "English Basic", progress: 100, lastActivity: "Completed!" },
  { id: "3", title: "Physics", progress: 25, lastActivity: "3 days ago" },
];

const mockWeekDays = [
  { day: "Mon", completed: true },
  { day: "Tue", completed: true },
  { day: "Wed", completed: true },
  { day: "Thu", completed: true },
  { day: "Fri", completed: false },
  { day: "Sat", completed: false },
  { day: "Sun", completed: false },
];

export default function ParentDashboardPage() {
  const { children: storeChildren } = useAuthStore();
  const [selectedChildId, setSelectedChildId] = useState(mockChildren[0]?.id);

  const selectedChild = mockChildren.find((c) => c.id === selectedChildId) || mockChildren[0];

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Child Selector */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {mockChildren.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-all flex-shrink-0",
                  selectedChildId === child.id
                    ? "bg-primary-500 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                <Avatar
                  src={child.avatar}
                  fallback={child.name}
                  size="xs"
                />
                <span className="text-sm font-medium">{child.name}</span>
              </button>
            ))}
            <Button variant="ghost" size="sm" className="flex-shrink-0">
              + Add Child
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weekly Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
              <div className="flex items-center justify-center gap-1 text-orange-600">
                <Flame className="w-5 h-5" />
                <span className="text-xl font-bold">{selectedChild.streak}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Day Streak</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center justify-center gap-1 text-blue-600">
                <Clock className="w-5 h-5" />
                <span className="text-xl font-bold">{formatTime(selectedChild.weeklyTime)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Study Time</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <div className="flex items-center justify-center gap-1 text-green-600">
                <BookOpen className="w-5 h-5" />
                <span className="text-xl font-bold">{selectedChild.weeklyLessons}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Lessons</p>
            </div>
          </div>

          {/* Weekly Calendar */}
          <div className="flex gap-2 justify-center pt-2">
            {mockWeekDays.map((day, index) => {
              const isToday = index === 4; // Friday is today in mock
              return (
                <div
                  key={day.day}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                    day.completed
                      ? "bg-green-500 text-white"
                      : isToday
                        ? "border-2 border-primary-500 text-primary-500"
                        : "bg-gray-100 dark:bg-gray-800 text-muted-foreground"
                  )}
                >
                  {day.completed ? <CheckCircle2 className="w-5 h-5" /> : day.day[0]}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Enrolled Courses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Enrolled Courses</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/children/courses" className="flex items-center gap-1">
              View All
              <ChevronRight className="w-4 h-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockCourses.map((course) => (
              <div key={course.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{course.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {course.lastActivity}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <ProgressBar
                    value={course.progress}
                    variant="course"
                    size="md"
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-12 text-right">
                    {course.progress}%
                  </span>
                  {course.progress === 100 && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quiz Scores & Recommendations */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Quiz Scores */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Quiz Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="text-4xl font-bold text-primary-600">
                {selectedChild.quizAverage}%
              </div>
              <p className="text-sm text-muted-foreground mt-1">Average Score</p>
            </div>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/children/reports">View Details</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-sm">
              <p className="text-primary-800 dark:text-primary-200">
                {selectedChild.name} is doing great in Math! Consider adding{" "}
                <strong>Advanced Algebra</strong> to continue their progress.
              </p>
            </div>
            <Button variant="outline" className="w-full mt-3" asChild>
              <Link href="/courses">Browse Courses</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Subscription */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Subscription
          </CardTitle>
          <Badge variant="secondary">Premium Family</Badge>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Next billing: March 15, 2026
              </p>
              <p className="text-sm text-muted-foreground">
                2 children covered
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/subscription">Manage</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
