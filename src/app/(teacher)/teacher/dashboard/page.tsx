"use client";

import Link from "next/link";
import {
  Users,
  BookOpen,
  FileText,
  DollarSign,
  Plus,
  BarChart3,
  GraduationCap,
  ClipboardList,
  ChevronRight,
  Star,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useMe } from "@/hooks/queries/use-auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/dashboard";
import { formatCurrency } from "@/lib/utils";

// Mock data - replace with API calls
const mockStats = {
  totalStudents: 1234,
  studentsChange: 12,
  activeCourses: 5,
  totalLessons: 48,
  monthlyRevenue: 12500000,
  revenueChange: 8,
};

const mockCourses = [
  { id: "1", title: "Calculus Basics", students: 456, rating: 4.8 },
  { id: "2", title: "Linear Algebra", students: 234, rating: 4.6 },
  { id: "3", title: "Statistics 101", students: 189, rating: 4.9 },
];

const mockRecentActivity = [
  { text: "15 students completed 'Calculus Basics' today", time: "2h ago" },
  { text: "3 new enrollments in 'Linear Algebra'", time: "5h ago" },
  { text: "8 assignments pending review", time: "1d ago" },
];

const quickActions = [
  { icon: <Plus className="w-5 h-5" />, label: "Create Course", href: "/teacher/courses" },
  { icon: <BarChart3 className="w-5 h-5" />, label: "View Analytics", href: "/teacher/analytics" },
  { icon: <GraduationCap className="w-5 h-5" />, label: "Manage Classes", href: "/teacher/classes" },
  { icon: <ClipboardList className="w-5 h-5" />, label: "Grade Assignments", href: "/teacher/assignments" },
];

export default function TeacherDashboardPage() {
  const { activeOrg } = useAuthStore();
  const { data: meData } = useMe();

  const userName = meData?.user?.name || "Teacher";

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="bg-gradient-to-r from-primary-500 to-secondary-600 text-white border-0">
        <CardContent className="py-6">
          <h1 className="text-2xl font-bold">Welcome back, {userName}!</h1>
          <p className="opacity-90 mt-1">
            You have 3 pending reviews and 8 new student messages.
          </p>
          {activeOrg && (
            <p className="text-sm opacity-80 mt-2">
              Organization: {activeOrg.name}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Students"
          value={mockStats.totalStudents.toLocaleString()}
          change={mockStats.studentsChange}
          icon={<Users className="w-5 h-5" />}
        />
        <StatsCard
          title="Active Courses"
          value={mockStats.activeCourses}
          icon={<BookOpen className="w-5 h-5" />}
        />
        <StatsCard
          title="Total Lessons"
          value={mockStats.totalLessons}
          icon={<FileText className="w-5 h-5" />}
        />
        <StatsCard
          title="Revenue (Month)"
          value={formatCurrency(mockStats.monthlyRevenue)}
          change={mockStats.revenueChange}
          icon={<DollarSign className="w-5 h-5" />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* My Courses */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              My Courses
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/teacher/courses" className="flex items-center gap-1">
                View All
                <ChevronRight className="w-4 h-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/teacher/courses`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-400 to-secondary-500" />
                    <div>
                      <h4 className="font-medium">{course.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {course.students} students
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-medium">{course.rating}</span>
                  </div>
                </Link>
              ))}
              <Button variant="outline" className="w-full mt-2" asChild>
                <Link href="/teacher/courses" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add New Course
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2"
                  asChild
                >
                  <Link href={action.href}>
                    {action.icon}
                    <span className="text-xs">{action.label}</span>
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Student Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockRecentActivity.map((activity, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div className="w-2 h-2 mt-2 rounded-full bg-primary-500" />
                <div className="flex-1">
                  <p className="text-sm">{activity.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
