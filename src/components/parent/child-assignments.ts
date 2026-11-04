import type { ChildAssignment } from "@/services/parent-dashboard.service";

/**
 * P-02 (QA3 261104): "Bài tập sắp hạn" từng liệt kê cả bài đã quá hạn, cũ nhất trước, không đánh dấu.
 * Tách theo hạn nộp tính từ `due_date` (không phụ thuộc trường `overdue` của API):
 * - `upcoming`: chưa hoàn thành, hạn >= now, gần hạn nhất trước.
 * - `overdue`: chưa hoàn thành, hạn < now, vừa quá hạn gần đây nhất trước.
 * Bài không có hạn nộp hoặc `due_date` không đọc được bị bỏ qua.
 */
export function splitAssignmentsByDeadline(
  assignments: ChildAssignment[],
  now: number = Date.now(),
): { upcoming: ChildAssignment[]; overdue: ChildAssignment[] } {
  const pending = assignments
    .filter((a) => a.status !== "completed" && a.due_date)
    .map((a) => ({ a, due: new Date(a.due_date!).getTime() }))
    .filter(({ due }) => Number.isFinite(due));
  return {
    upcoming: pending.filter(({ due }) => due >= now).sort((x, y) => x.due - y.due).map(({ a }) => a),
    overdue: pending.filter(({ due }) => due < now).sort((x, y) => y.due - x.due).map(({ a }) => a),
  };
}
