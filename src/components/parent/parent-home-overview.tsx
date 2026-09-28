"use client";

/**
 * Tổng quan con trên `/home` của phụ huynh — QA 260927 P1: trước đây `/home`
 * render nguyên dashboard học sinh cho cả phụ huynh (0 khoá, 0% tiến độ...),
 * 0 đường dẫn nào tới thông tin con — vi phạm mục tiêu brief "phụ huynh hiểu
 * con học thế nào trong ≤2 lần bấm". Dữ liệu lấy từ API phụ huynh ĐANG CÓ
 * (`parent-dashboard.service.ts` — đã tồn tại đầy đủ, chỉ chưa có UI dùng).
 */

import Image from "next/image";
import Link from "next/link";
import {
  Users, ChevronRight, Flame, GraduationCap, BookOpen, Clock,
  ClipboardList, CalendarCheck, Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useChildren } from "@/hooks/queries/use-auth";
import {
  useChildOverview,
  useChildAssignments,
  useChildAttendance,
} from "@/hooks/queries/use-parent-dashboard";
import type { Child } from "@/services/auth.service";
import { inProgressCourseCount } from "./child-stats";

function formatMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0 phút";
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m} phút`;
  if (m === 0) return `${h} giờ`;
  return `${h} giờ ${m} phút`;
}

function StatPill({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
      <Icon className="h-4 w-4 text-primary-600 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
        <p className="text-[11px] text-gray-500 truncate">{label}</p>
      </div>
    </div>
  );
}

/** Một thẻ tổng quan cho MỘT con — tự gọi hook riêng (đúng Rules of Hooks vì mỗi instance là 1 lần gọi component). */
function ParentChildOverviewCard({ child }: { child: Child }) {
  const displayName = child.full_name || child.username;
  const { data: overview, isLoading: loadingOverview } = useChildOverview(child.id);
  const { data: assignmentsData, isLoading: loadingAssignments } = useChildAssignments(child.id, 1, 20);
  const { data: attendanceData, isLoading: loadingAttendance } = useChildAttendance(child.id, 1, 3);

  // Bài tập sắp hạn: chưa hoàn thành, có hạn nộp, sắp xếp gần nhất trước (P1 mục 5).
  const upcomingAssignments = (assignmentsData?.assignments ?? [])
    .filter((a) => a.status !== "completed" && a.due_date)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 3);

  const recentAttendance = attendanceData?.records ?? [];

  return (
    <Card className="p-5 bg-white border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          {child.avatar_url ? (
            <Image src={child.avatar_url} alt={displayName} width={44} height={44} className="rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
              <span className="text-base font-semibold text-primary-700">{displayName.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{displayName}</p>
            <p className="text-xs text-gray-500">Con của tôi</p>
          </div>
        </div>
        <Link href={`/parent/children/${child.id}`}>
          <Button variant="outline" size="sm" className="shrink-0">
            Xem chi tiết <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </Link>
      </div>

      {loadingOverview ? (
        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
      ) : overview ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <StatPill icon={BookOpen} label="Đang học" value={inProgressCourseCount(overview)} />
          <StatPill icon={GraduationCap} label="Hoàn thành" value={overview.completed_courses} />
          <StatPill icon={Clock} label="Thời gian học" value={formatMinutes(overview.total_study_minutes)} />
          <StatPill icon={Flame} label="Chuỗi ngày học" value={overview.current_streak} />
        </div>
      ) : (
        <p className="text-sm text-gray-400 mb-4">Chưa có dữ liệu tổng quan.</p>
      )}

      <div className="grid sm:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
        {/* Bài tập sắp hạn */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <ClipboardList className="h-4 w-4 text-amber-500" />
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Bài tập sắp hạn</h4>
          </div>
          {loadingAssignments ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : upcomingAssignments.length === 0 ? (
            <p className="text-xs text-gray-400">Không có bài tập nào sắp tới hạn.</p>
          ) : (
            <ul className="space-y-1.5">
              {upcomingAssignments.map((a) => (
                <li key={a.id} className="text-xs text-gray-600 flex items-center justify-between gap-2">
                  <span className="truncate">{a.title}</span>
                  <span className="text-gray-400 shrink-0">
                    {a.due_date ? new Date(a.due_date).toLocaleDateString("vi-VN") : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Điểm danh gần đây */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <CalendarCheck className="h-4 w-4 text-emerald-500" />
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Điểm danh gần đây</h4>
          </div>
          {loadingAttendance ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : recentAttendance.length === 0 ? (
            <p className="text-xs text-gray-400">Chưa có dữ liệu điểm danh.</p>
          ) : (
            <ul className="space-y-1.5">
              {recentAttendance.map((r) => (
                <li key={r.id} className="text-xs text-gray-600 flex items-center justify-between gap-2">
                  <span className="truncate">{r.class_name} — buổi {r.session_number}</span>
                  <span className={
                    r.status === "present" ? "text-green-600 shrink-0"
                    : r.status === "late" ? "text-amber-600 shrink-0"
                    : r.status === "absent" ? "text-red-600 shrink-0"
                    : "text-gray-400 shrink-0"
                  }>
                    {r.status === "present" ? "Có mặt" : r.status === "late" ? "Trễ" : r.status === "absent" ? "Vắng" : "Có phép"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}

export function ParentHomeOverview() {
  const { data: childrenData, isLoading } = useChildren();
  const children = childrenData?.children ?? [];

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="max-w-5xl mx-auto px-4 lg:px-6 py-5 space-y-5">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Con của tôi</h1>
          <p className="text-sm text-gray-500 mt-1">Tổng quan tiến độ học tập, bài tập và điểm danh của con.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : children.length === 0 ? (
          <Card className="p-10 text-center bg-white border border-gray-100">
            <Users className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-700 font-medium mb-1">Chưa liên kết với con nào</p>
            <p className="text-gray-500 text-sm mb-4">
              Vào &quot;Con của tôi&quot; để gửi yêu cầu liên kết theo email của con (con cần xác nhận),
              hoặc chấp nhận lời mời con đã gửi cho bạn.
            </p>
            <Link href="/settings/family">
              <Button variant="outline" size="sm">
                Đi tới &quot;Con của tôi&quot; <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {children.map((child) => (
              <ParentChildOverviewCard key={child.id} child={child} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
