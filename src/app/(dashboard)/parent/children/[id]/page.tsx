"use client";

import { useState, useMemo, useEffect } from "react";
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
import WeekCalendarGrid, { type ScheduleEvent } from "@/components/schedule/week-calendar-grid";
import ScheduleEventDetailDialog from "@/components/schedule/schedule-event-detail-dialog";
import { timetableEntriesToEvents } from "@/lib/teacher-schedule-events";
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
import { ChildAssignmentsTab } from "@/components/parent/child-assignments-tab";
import { ChildAttendanceStatus } from "@/components/parent/child-attendance-status";
import { assignmentTypeLabel, difficultyLabel, gradeTypeLabel, roomLabel } from "@/lib/display-labels";
import { formatStudyMinutes } from "@/lib/format-study-time";

type TabType = "overview" | "courses" | "grades" | "schedule" | "attendance" | "assignments";

const TABS: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Tổng quan", icon: Users },
  { id: "courses", label: "Khoá học", icon: BookOpen },
  { id: "grades", label: "Điểm số", icon: GraduationCap },
  { id: "schedule", label: "Lịch học", icon: Calendar },
  { id: "attendance", label: "Điểm danh", icon: CheckCircle },
  { id: "assignments", label: "Bài tập", icon: Trophy },
];

/** QA-B-26: "90.0%" thừa ".0", và dùng dấu phẩy thập phân kiểu Việt ("87,5%"). */
function formatPercent(value: number): string {
  return `${value.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`;
}

function formatGradedAt(value: string | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("vi-VN");
}

function ScheduleGrid({ entries }: { entries: TimetableEntry[] }) {
  const [detail, setDetail] = useState<ScheduleEvent | null>(null);
  const events = useMemo(() => timetableEntriesToEvents(entries).map(event => ({ ...event, teacher: undefined })), [entries]);
  return <>
    <WeekCalendarGrid events={events} onEventClick={setDetail} />
    <ScheduleEventDetailDialog event={detail} open={!!detail} onOpenChange={open => { if (!open) setDetail(null); }} />
  </>;
}

export default function ChildDetailPage() {
  const params = useParams();
  const router = useRouter();
  const childId = params.id as string;
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  // QA-B-24: trước đây chỉ `?tab=schedule` được đọc, tải lại trang ở tab khác là về Tổng quan. Mọi tab đều
  // đọc/ghi `?tab=`; ghi bằng history.replaceState để không thêm một mục lịch sử cho mỗi lần đổi tab.
  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (TABS.some((t) => t.id === tab)) setActiveTab(tab as TabType);
  }, []);
  const selectTab = (tab: TabType) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    if (tab === "overview") url.searchParams.delete("tab");
    else url.searchParams.set("tab", tab);
    window.history.replaceState(window.history.state, "", url.toString());
  };

  const { data: overview, isLoading: loadingOverview } = useChildOverview(childId);
  // PG-L2: chỉ chạy các query còn lại SAU khi overview xác nhận đây là con của phụ huynh. Id lạ thì overview
  // 403 và trước đây 5 query kia vẫn bắn song song (6 × 403). Id rỗng làm hook tự tắt qua `enabled: !!childId`.
  const dataChildId = overview ? childId : "";
  const { data: coursesData, isLoading: loadingCourses } = useChildCourses(dataChildId);
  const { data: gradesData, isLoading: loadingGrades } = useChildGrades(activeTab === "grades" ? dataChildId : "");
  const { data: timetableData, isLoading: loadingTimetable } = useChildTimetable(activeTab === "schedule" ? dataChildId : "");
  const { data: attendanceData, isLoading: loadingAttendance } = useChildAttendance(dataChildId);
  const { data: assignmentsData, isLoading: loadingAssignments } = useChildAssignments(dataChildId);

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
          {/* QA-B-26: toLocaleString() không truyền locale ra "1,850" trên máy tiếng Anh; app dùng dấu chấm. */}
          <p className="text-2xl font-bold">{overview.total_xp.toLocaleString("vi-VN")}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-2 text-blue-500 mb-2">
            <BookOpen className="w-5 h-5" />
            <span className="text-sm font-medium">Khoá học</span>
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
              onClick={() => selectTab(tab.id)}
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
                <>
                  {/* P-06 (QA3 261104): dưới 640px bảng 6 cột bị cắt "Điểm / % / Chấm bởi" sau thanh cuộn ngang
                      không có dấu hiệu; dùng danh sách thẻ, mỗi điểm một thẻ đọc hết. */}
                  <ul className="space-y-2 sm:hidden" data-testid="grades-cards">
                    {gradesData?.grades.map((grade) => (
                      <li key={grade.id} className="rounded-xl border border-gray-100 bg-white p-3 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900">{grade.title}</p>
                            <p className="text-xs text-gray-500">
                              {grade.class_name} · {gradeTypeLabel(grade.grade_type)}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="font-medium text-gray-900">
                              {grade.score}/{grade.max_score}
                            </p>
                            <p
                              className={cn(
                                "text-xs font-medium",
                                grade.percentage >= 80
                                  ? "text-green-600"
                                  : grade.percentage >= 50
                                    ? "text-yellow-600"
                                    : "text-red-600"
                              )}
                            >
                              {formatPercent(grade.percentage)}
                            </p>
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Chấm bởi: {grade.graded_by_name || "—"} · Ngày chấm {formatGradedAt(grade.graded_at)}
                        </p>
                      </li>
                    ))}
                  </ul>
                  <div className="hidden overflow-x-auto sm:block">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-600">Lớp</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-600">Loại</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-600">Tiêu đề</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-600">Điểm</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-600">%</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-600">Chấm bởi</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-600">Ngày chấm</th>
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
                                {formatPercent(grade.percentage)}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-gray-600">{grade.graded_by_name || "—"}</td>
                            <td className="px-4 py-2 text-gray-600">{formatGradedAt(grade.graded_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
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
                          <ChildAttendanceStatus
                            status={record.status}
                            lateMinutes={record.late_minutes}
                            withIcon
                            className="text-sm"
                          />
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
            <ChildAssignmentsTab data={assignmentsData} isLoading={loadingAssignments} />
          )}
        </div>
      </div>
    </div>
  );
}
