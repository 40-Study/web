"use client";

import { BookOpen, CalendarCheck, ClipboardList } from "lucide-react";
import { splitAssignmentsByDeadline } from "./child-assignments";
import { ChildAttendanceStatus } from "./child-attendance-status";
import type {
  ChildAssignment,
  ChildAttendance,
  ChildCourse,
  ChildOverview,
} from "@/services/parent-dashboard.service";

/**
 * Tab "Tổng quan" (E5, QA vòng 2): trước đây chỉ có một câu "Chọn các tab khác để xem chi tiết",
 * tab mặc định trống. Nay tóm tắt thật từ dữ liệu các tab khác đã tải: khoá đang học + tiến độ,
 * bài tập chưa xong gần hạn, điểm danh gần đây.
 */
export function ChildOverviewTab({
  overview,
  courses,
  assignments,
  attendance,
}: {
  overview: ChildOverview;
  courses: ChildCourse[];
  assignments: ChildAssignment[];
  attendance: ChildAttendance[];
}) {
  const inProgress = courses.filter((c) => !c.completed_at).slice(0, 4);
  const { upcoming: upcomingAll, overdue: overdueAll } = splitAssignmentsByDeadline(assignments);
  const upcoming = upcomingAll.slice(0, 3);
  const overdue = overdueAll.slice(0, 3);
  const recentAttendance = attendance.slice(0, 3);

  return (
    <div className="space-y-5">
      {!overview.can_view_progress && (
        <Notice>Bạn không có quyền xem tiến độ học tập</Notice>
      )}
      {!overview.can_view_grades && <Notice>Bạn không có quyền xem điểm số</Notice>}
      {!overview.can_view_attendance && <Notice>Bạn không có quyền xem điểm danh</Notice>}

      <Section icon={BookOpen} title="Khoá đang học" empty={inProgress.length === 0 ? "Không có khoá nào đang học." : null}>
        {inProgress.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-foreground">{c.course_name}</span>
            <span className="shrink-0 font-medium text-primary-600 dark:text-primary-400">{Math.round(c.progress_percent)}%</span>
          </li>
        ))}
      </Section>

      <Section icon={ClipboardList} title="Bài tập sắp hạn" empty={upcoming.length === 0 ? "Không có bài tập nào sắp tới hạn." : null}>
        {upcoming.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-foreground">{a.title}</span>
            <span className="shrink-0 text-muted-foreground">{new Date(a.due_date!).toLocaleDateString("vi-VN")}</span>
          </li>
        ))}
      </Section>

      {overdue.length > 0 && (
        <Section icon={ClipboardList} title={`Quá hạn (${overdueAll.length})`} empty={null}>
          {overdue.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-foreground">{a.title}</span>
              <span className="shrink-0 rounded bg-red-50 px-1.5 py-0.5 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                Chưa nộp, hạn {new Date(a.due_date!).toLocaleDateString("vi-VN")}
              </span>
            </li>
          ))}
        </Section>
      )}

      <Section icon={CalendarCheck} title="Điểm danh gần đây" empty={recentAttendance.length === 0 ? "Chưa có dữ liệu điểm danh." : null}>
        {recentAttendance.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-foreground">{r.class_name} — buổi {r.session_number}</span>
            <ChildAttendanceStatus status={r.status} className="shrink-0" />
          </li>
        ))}
      </Section>
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 dark:bg-yellow-500/10 dark:border-yellow-500/30 dark:text-yellow-300">{children}</div>;
}

function Section({
  icon: Icon,
  title,
  empty,
  children,
}: {
  icon: React.ElementType;
  title: string;
  empty: string | null;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {empty ? <p className="text-sm text-muted-foreground">{empty}</p> : <ul className="space-y-2">{children}</ul>}
    </section>
  );
}
