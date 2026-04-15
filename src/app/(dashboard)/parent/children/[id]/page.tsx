"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Flame,
  GraduationCap,
  Loader2,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useChildOverview,
  useChildCourses,
  useChildGrades,
  useChildTimetable,
  useChildAttendance,
  useChildAssignments,
} from "@/hooks/queries/use-parent-dashboard";
import type { TimetableEntry } from "@/services/parent-dashboard.service";

type TabType = "overview" | "courses" | "grades" | "schedule" | "attendance" | "assignments";

const TABS: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Tổng quan", icon: Users },
  { id: "courses", label: "Khóa học", icon: BookOpen },
  { id: "grades", label: "Điểm số", icon: GraduationCap },
  { id: "schedule", label: "Lịch học", icon: Calendar },
  { id: "attendance", label: "Điểm danh", icon: CheckCircle },
  { id: "assignments", label: "Bài tập", icon: Trophy },
];

const DAY_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7:00 - 20:00

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function ScheduleGrid({ entries }: { entries: TimetableEntry[] }) {
  // Group entries by day
  const entriesByDay = useMemo(() => {
    const grouped: Record<number, TimetableEntry[]> = {};
    for (let i = 0; i < 7; i++) grouped[i] = [];
    entries.forEach((e) => {
      if (grouped[e.day_of_week]) {
        grouped[e.day_of_week].push(e);
      }
    });
    return grouped;
  }, [entries]);

  const colors = [
    "bg-blue-100 border-blue-300 text-blue-800",
    "bg-green-100 border-green-300 text-green-800",
    "bg-purple-100 border-purple-300 text-purple-800",
    "bg-orange-100 border-orange-300 text-orange-800",
    "bg-pink-100 border-pink-300 text-pink-800",
    "bg-cyan-100 border-cyan-300 text-cyan-800",
  ];

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="grid grid-cols-8 border-b">
          <div className="p-2 text-center text-sm font-medium text-gray-500 border-r">Giờ</div>
          {[1, 2, 3, 4, 5, 6, 0].map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-700">
              {DAY_NAMES[day]}
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="relative">
          {HOURS.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b h-16">
              <div className="p-1 text-xs text-gray-400 border-r flex items-start justify-center">
                {hour}:00
              </div>
              {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                <div key={day} className="relative border-r last:border-r-0" />
              ))}
            </div>
          ))}

          {/* Render entries */}
          {[1, 2, 3, 4, 5, 6, 0].map((day, colIndex) =>
            entriesByDay[day]?.map((entry, idx) => {
              const startMins = timeToMinutes(entry.start_time);
              const endMins = timeToMinutes(entry.end_time);
              const top = ((startMins - 7 * 60) / 60) * 64; // 64px per hour
              const height = ((endMins - startMins) / 60) * 64;

              return (
                <div
                  key={`${day}-${idx}`}
                  className={cn(
                    "absolute rounded-md border p-1 text-xs overflow-hidden",
                    colors[idx % colors.length]
                  )}
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    left: `calc(${(colIndex + 1) * 12.5}% + 2px)`,
                    width: "calc(12.5% - 4px)",
                  }}
                >
                  <div className="font-medium truncate">{entry.class_name}</div>
                  <div className="truncate">
                    {entry.start_time} - {entry.end_time}
                  </div>
                  {entry.room && <div className="truncate text-[10px]">P.{entry.room}</div>}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChildDetailPage() {
  const params = useParams();
  const router = useRouter();
  const childId = params.id as string;
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const { data: overview, isLoading: loadingOverview } = useChildOverview(childId);
  const { data: coursesData, isLoading: loadingCourses } = useChildCourses(childId);
  const { data: gradesData, isLoading: loadingGrades } = useChildGrades(childId);
  const { data: timetableData, isLoading: loadingTimetable } = useChildTimetable(childId);
  const { data: attendanceData, isLoading: loadingAttendance } = useChildAttendance(childId);
  const { data: assignmentsData, isLoading: loadingAssignments } = useChildAssignments(childId);

  if (loadingOverview) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không tìm thấy thông tin học sinh</p>
        <button onClick={() => router.back()} className="mt-4 text-primary-600 hover:underline">
          Quay lại
        </button>
      </div>
    );
  }

  const displayName = overview.full_name || overview.username;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/settings/family"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </Link>

        <div className="flex items-center gap-4">
          {overview.avatar_url ? (
            <Image
              src={overview.avatar_url}
              alt={displayName}
              width={64}
              height={64}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-700">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
            <p className="text-sm text-gray-500">{overview.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
              {overview.relationship === "parent" ? "Phụ huynh" : overview.relationship}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-2 text-orange-500 mb-2">
            <Flame className="w-5 h-5" />
            <span className="text-sm font-medium">Streak</span>
          </div>
          <p className="text-2xl font-bold">{overview.current_streak} ngày</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-2 text-purple-500 mb-2">
            <Trophy className="w-5 h-5" />
            <span className="text-sm font-medium">Tổng XP</span>
          </div>
          <p className="text-2xl font-bold">{overview.total_xp.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-2 text-blue-500 mb-2">
            <BookOpen className="w-5 h-5" />
            <span className="text-sm font-medium">Khóa học</span>
          </div>
          <p className="text-2xl font-bold">
            {overview.completed_courses}/{overview.enrolled_courses}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-2 text-green-500 mb-2">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium">Thời gian học</span>
          </div>
          <p className="text-2xl font-bold">{Math.round(overview.total_study_minutes / 60)}h</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="flex border-b overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors",
                activeTab === tab.id
                  ? "text-primary-600 border-b-2 border-primary-600 bg-primary-50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <p className="text-gray-600">
                Xem tổng quan tiến độ học tập của {displayName}. Chọn các tab khác để xem chi tiết.
              </p>
              {!overview.can_view_progress && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
                  Bạn không có quyền xem tiến độ học tập
                </div>
              )}
              {!overview.can_view_grades && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
                  Bạn không có quyền xem điểm số
                </div>
              )}
              {!overview.can_view_attendance && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
                  Bạn không có quyền xem điểm danh
                </div>
              )}
            </div>
          )}

          {/* Courses Tab */}
          {activeTab === "courses" && (
            <div>
              {loadingCourses ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : coursesData?.courses.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Chưa đăng ký khóa học nào</p>
              ) : (
                <div className="space-y-3">
                  {coursesData?.courses.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center gap-4 p-3 rounded-lg border hover:bg-gray-50"
                    >
                      {course.course_thumbnail ? (
                        <Image
                          src={course.course_thumbnail}
                          alt={course.course_name}
                          width={80}
                          height={45}
                          className="rounded object-cover"
                        />
                      ) : (
                        <div className="w-20 h-11 rounded bg-gray-200 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{course.course_name}</h3>
                        <p className="text-sm text-gray-500">{course.instructor_name}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-primary-600">
                          {course.progress_percent.toFixed(0)}%
                        </div>
                        <div className="w-20 h-2 bg-gray-200 rounded-full mt-1">
                          <div
                            className="h-full bg-primary-500 rounded-full"
                            style={{ width: `${course.progress_percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Grades Tab */}
          {activeTab === "grades" && (
            <div>
              {loadingGrades ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : gradesData?.grades.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Chưa có điểm nào</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Lớp</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Loại</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Tiêu đề</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-600">Điểm</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-600">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {gradesData?.grades.map((grade) => (
                        <tr key={grade.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2">{grade.class_name}</td>
                          <td className="px-4 py-2 capitalize">{grade.grade_type}</td>
                          <td className="px-4 py-2">{grade.title}</td>
                          <td className="px-4 py-2 text-right">
                            {grade.score}/{grade.max_score}
                          </td>
                          <td className="px-4 py-2 text-right font-medium">
                            <span
                              className={cn(
                                grade.percentage >= 80
                                  ? "text-green-600"
                                  : grade.percentage >= 50
                                    ? "text-yellow-600"
                                    : "text-red-600"
                              )}
                            >
                              {grade.percentage.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === "schedule" && (
            <div>
              {loadingTimetable ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : timetableData?.entries.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Chưa có lịch học</p>
              ) : (
                <ScheduleGrid entries={timetableData?.entries || []} />
              )}
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === "attendance" && (
            <div>
              {loadingAttendance ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <>
                  {/* Stats */}
                  {attendanceData?.stats && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                      <div className="text-center p-3 rounded-lg bg-gray-50">
                        <p className="text-2xl font-bold">{attendanceData.stats.total_sessions}</p>
                        <p className="text-xs text-gray-500">Tổng buổi</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-green-50">
                        <p className="text-2xl font-bold text-green-600">
                          {attendanceData.stats.present_count}
                        </p>
                        <p className="text-xs text-gray-500">Có mặt</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-yellow-50">
                        <p className="text-2xl font-bold text-yellow-600">
                          {attendanceData.stats.late_count}
                        </p>
                        <p className="text-xs text-gray-500">Trễ</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-red-50">
                        <p className="text-2xl font-bold text-red-600">
                          {attendanceData.stats.absent_count}
                        </p>
                        <p className="text-xs text-gray-500">Vắng</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-primary-50">
                        <p className="text-2xl font-bold text-primary-600">
                          {attendanceData.stats.attendance_rate.toFixed(0)}%
                        </p>
                        <p className="text-xs text-gray-500">Tỷ lệ</p>
                      </div>
                    </div>
                  )}

                  {/* Records */}
                  {attendanceData?.records.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">Chưa có dữ liệu điểm danh</p>
                  ) : (
                    <div className="space-y-2">
                      {attendanceData?.records.map((record) => (
                        <div
                          key={record.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div>
                            <p className="font-medium">{record.class_name}</p>
                            <p className="text-sm text-gray-500">
                              Buổi {record.session_number} -{" "}
                              {new Date(record.date).toLocaleDateString("vi-VN")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {record.status === "present" && (
                              <span className="flex items-center gap-1 text-green-600 text-sm">
                                <CheckCircle className="w-4 h-4" /> Có mặt
                              </span>
                            )}
                            {record.status === "late" && (
                              <span className="flex items-center gap-1 text-yellow-600 text-sm">
                                <Clock className="w-4 h-4" /> Trễ {record.late_minutes}p
                              </span>
                            )}
                            {record.status === "absent" && (
                              <span className="flex items-center gap-1 text-red-600 text-sm">
                                <XCircle className="w-4 h-4" /> Vắng
                              </span>
                            )}
                            {record.status === "excused" && (
                              <span className="text-gray-600 text-sm">Có phép</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Assignments Tab */}
          {activeTab === "assignments" && (
            <div>
              {loadingAssignments ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <>
                  {/* Stats */}
                  {assignmentsData?.stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                      <div className="text-center p-3 rounded-lg bg-gray-50">
                        <p className="text-2xl font-bold">
                          {assignmentsData.stats.total_assignments}
                        </p>
                        <p className="text-xs text-gray-500">Tổng bài</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-green-50">
                        <p className="text-2xl font-bold text-green-600">
                          {assignmentsData.stats.completed}
                        </p>
                        <p className="text-xs text-gray-500">Hoàn thành</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-yellow-50">
                        <p className="text-2xl font-bold text-yellow-600">
                          {assignmentsData.stats.in_progress}
                        </p>
                        <p className="text-xs text-gray-500">Đang làm</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-red-50">
                        <p className="text-2xl font-bold text-red-600">
                          {assignmentsData.stats.overdue}
                        </p>
                        <p className="text-xs text-gray-500">Quá hạn</p>
                      </div>
                    </div>
                  )}

                  {/* Assignments List */}
                  {assignmentsData?.assignments.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">Chưa có bài tập nào</p>
                  ) : (
                    <div className="space-y-2">
                      {assignmentsData?.assignments.map((assignment) => (
                        <div key={assignment.id} className="p-3 rounded-lg border">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{assignment.title}</p>
                              <p className="text-sm text-gray-500">
                                {assignment.class_name} | {assignment.type} |{" "}
                                <span className="capitalize">{assignment.difficulty}</span>
                              </p>
                            </div>
                            <div className="text-right">
                              {assignment.status === "completed" ? (
                                <span className="text-green-600 text-sm font-medium">
                                  {assignment.test_cases_passed}/{assignment.total_test_cases} TC
                                </span>
                              ) : (
                                <span className="text-yellow-600 text-sm">Đang làm</span>
                              )}
                              <p className="text-xs text-gray-400">
                                {assignment.submission_count} lần nộp
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
