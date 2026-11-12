import type { ChildAssignment } from "@/services/parent-dashboard.service";

/**
 * Trạng thái hiển thị một bài tập của con cho phụ huynh. Đây là NGUỒN DUY NHẤT: trang chủ phụ huynh,
 * tab Tổng quan và tab Bài tập đều đi qua hàm này (QA-B-23: ba chỗ từng đếm quá hạn ba kiểu khác nhau).
 *
 * Quy tắc khớp backend `buildChildAssignmentDto` + `StudentClassAssignmentStats` (để danh sách khớp ô
 * thống kê `stats.overdue`):
 * - `completed`: backend báo `completed` (có bài nộp được chấp nhận).
 * - Đã nộp ít nhất một lần thì KHÔNG BAO GIỜ là quá hạn, dù hạn đã qua: con đã làm, việc còn lại là của
 *   giảng viên (`awaiting_grade`, bài nộp tốt nhất còn `pending`) hoặc con nộp chưa đạt (`needs_retry`).
 * - Chưa nộp lần nào: hạn đã qua là `overdue`, còn lại `not_started`.
 */
export type ChildAssignmentState = "completed" | "awaiting_grade" | "needs_retry" | "overdue" | "not_started";

export const CHILD_ASSIGNMENT_STATE_LABEL: Record<ChildAssignmentState, string> = {
  completed: "Hoàn thành",
  awaiting_grade: "Đã nộp, chờ chấm",
  needs_retry: "Đã nộp, chưa đạt",
  overdue: "Quá hạn, chưa nộp",
  not_started: "Chưa nộp",
};

/** Màu chữ cho từng trạng thái, dùng chung để ba màn hình tô cùng một màu. */
export const CHILD_ASSIGNMENT_STATE_CLASS: Record<ChildAssignmentState, string> = {
  completed: "text-green-600 dark:text-green-400",
  awaiting_grade: "text-blue-600 dark:text-blue-400",
  needs_retry: "text-amber-600 dark:text-amber-400",
  overdue: "text-red-600 dark:text-red-400",
  not_started: "text-muted-foreground",
};

function dueTime(a: ChildAssignment): number | null {
  if (!a.due_date) return null;
  const due = new Date(a.due_date).getTime();
  return Number.isFinite(due) ? due : null;
}

export function childAssignmentState(a: ChildAssignment, now: number = Date.now()): ChildAssignmentState {
  if (a.status === "completed") return "completed";
  if (a.submission_count > 0) {
    // Bài nộp tốt nhất vẫn `pending` (hoặc backend chưa trả verdict) nghĩa là đang chờ giảng viên chấm.
    return !a.best_verdict || a.best_verdict === "pending" ? "awaiting_grade" : "needs_retry";
  }
  const due = dueTime(a);
  return due !== null && due < now ? "overdue" : "not_started";
}

/**
 * P-02 (QA3 261104) + QA-B-23: tách bài cần con làm theo hạn nộp.
 * - `upcoming`: con còn phải làm (chưa nộp, hoặc nộp chưa đạt), hạn >= now, gần hạn nhất trước.
 * - `overdue`: trạng thái `overdue` (chưa nộp, hạn < now), vừa quá hạn gần đây nhất trước.
 * Bài đã hoàn thành, đang chờ chấm, không có hạn hoặc hạn không đọc được bị bỏ qua.
 */
export function splitAssignmentsByDeadline(
  assignments: ChildAssignment[],
  now: number = Date.now(),
): { upcoming: ChildAssignment[]; overdue: ChildAssignment[] } {
  const dated = assignments
    .map((a) => ({ a, due: dueTime(a), state: childAssignmentState(a, now) }))
    .filter((x): x is { a: ChildAssignment; due: number; state: ChildAssignmentState } => x.due !== null);
  return {
    upcoming: dated
      .filter(({ state, due }) => (state === "not_started" || state === "needs_retry") && due >= now)
      .sort((x, y) => x.due - y.due)
      .map(({ a }) => a),
    overdue: dated
      .filter(({ state }) => state === "overdue")
      .sort((x, y) => y.due - x.due)
      .map(({ a }) => a),
  };
}
