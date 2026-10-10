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
import { clockTimeToMinutes, formatClockTime } from "@/lib/schedule-time";
import {
  useChildOverview,
  useChildCourses,
  useChildGrades,
  useChildTimetable,
  useChildAttendance,
  useChildAssignments,
} from "@/hooks/queries/use-parent-dashboard";
import type { TimetableEntry } from "@/services/parent-dashboard.service";
import { ChildCoursesTab } from "@/components/parent/child-courses-tab";
import { ChildOverviewTab } from "@/components/parent/child-overview-tab";
import { assignmentTypeLabel, difficultyLabel, gradeTypeLabel, roomLabel } from "@/lib/display-labels";
import { formatStudyMinutes } from "@/lib/format-study-time";

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
              // API trả timestamp ISO đầy đủ; giờ không đọc được thì bỏ khối, không vẽ NaN.
              const startMins = clockTimeToMinutes(entry.start_time);
              const endMins = clockTimeToMinutes(entry.end_time);
              if (startMins === null || endMins === null) return null;
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
                    {formatClockTime(entry.start_time)} - {formatClockTime(entry.end_time)}
                  </div>
                  {entry.room && <div className="truncate text-[10px]">{roomLabel(entry.room)}</div>}
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

            {/* E4: `relationship` là quan hệ của NGƯỜI XEM với con (parent/guardian/...), gắn
                "Phụ huynh" dưới tên con đọc như thể con là phụ huynh. Nhãn đúng: "Con của bạn". */}
            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
              Con của bạn
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-2 text-orange-500 mb-2">
            <Flame className="w-5 h-5" />
            <span className="text-sm font-medium">Chuỗi ngày học</span>
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
          <p className="text-xs text-gray-500">hoàn thành</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-2 text-green-500 mb-2">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium">Thời gian học</span>
          </div>
          <p className="text-2xl font-bold">{formatStudyMinutes(overview.total_study_minutes)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {/* E6: 390px chỉ thấy 3/6 tab và không có dấu hiệu cuộn — mobile xếp lưới 3×2 cho thấy
            đủ 6 tab, từ sm trở lên giữ một hàng như cũ. */}
        <div role="tablist" className="grid grid-cols-3 sm:flex border-b sm:overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors",
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
            <ChildOverviewTab
              overview={overview}
              courses={coursesData?.courses ?? []}
              assignments={assignmentsData?.assignments ?? []}
              attendance={attendanceData?.records ?? []}
            />
          )}

          {/* Courses Tab */}
          {activeTab === "courses" && (
            <ChildCoursesTab courses={coursesData?.courses} isLoading={loadingCourses} />
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
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Chấm bởi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {gradesData?.grades.map((grade) => (
                        <tr key={grade.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2">{grade.class_name}</td>
                          <td className="px-4 py-2">{gradeTypeLabel(grade.grade_type)}</td>
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
                          <td className="px-4 py-2 text-gray-600">{grade.graded_by_name || "—"}</td>
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
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
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
                      {/* P6: buổi nghỉ có phép phải có thẻ riêng, nếu không
                          present+late+absent không bằng tổng. */}
                      <div className="text-center p-3 rounded-lg bg-blue-50">
                        <p className="text-2xl font-bold text-blue-600">
                          {attendanceData.stats.excused_count}
                        </p>
                        <p className="text-xs text-gray-500">Có phép</p>
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
                                {/* /parent/children/:id/assignments không trả class_name — chỉ hiện khi có */}
                                {assignment.class_name && <>{assignment.class_name} | </>}
                                {[assignmentTypeLabel(assignment.type), difficultyLabel(assignment.difficulty)]
                                  .filter(Boolean)
                                  .join(" | ")}
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
