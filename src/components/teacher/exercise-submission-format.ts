/**
 * Hiển thị một bài nộp bài thực hành code cho giảng viên: nhãn kết quả, điểm, thời điểm nộp.
 */

import { CODE_VERDICT_LABELS } from "@/components/code-workspace/code-judge-result";
import type { ExerciseSubmissionRecord } from "@/services/exercise.service";

/** Trạng thái chỉ có ở bảng `exercise_submissions` (không có trong kết quả chấm trực tiếp). */
const EXTRA_VERDICT_LABELS: Record<string, string> = {
  PENDING: "Đang chấm",
  SYSTEM_ERROR: "Lỗi hệ thống chấm",
  ERROR: "Lỗi hệ thống chấm",
};

/** Backend lưu `verdict` viết thường (`wrong_answer`); nhãn dùng chung với màn chấm của học viên. */
export function verdictLabel(verdict: string): string {
  const key = (verdict || "").toUpperCase();
  return CODE_VERDICT_LABELS[key] ?? EXTRA_VERDICT_LABELS[key] ?? verdict;
}

export type VerdictTone = "success" | "warning" | "destructive" | "secondary";

export function verdictTone(verdict: string): VerdictTone {
  const key = (verdict || "").toUpperCase();
  if (key === "ACCEPTED") return "success";
  if (key === "PENDING") return "secondary";
  if (key === "WRONG_ANSWER") return "warning";
  return "destructive";
}

/** Cùng công thức với backend (`lesson_code_service.go`): `100 * passed / total`, chia nguyên. */
export function submissionScore(sub: Pick<ExerciseSubmissionRecord, "test_cases_passed" | "total_test_cases">): number {
  return sub.total_test_cases > 0 ? Math.floor((100 * sub.test_cases_passed) / sub.total_test_cases) : 0;
}

const DATE_TIME = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatSubmittedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : DATE_TIME.format(date);
}

/** Tên học viên; backend chưa gắn `student` (bản cũ) thì hiện mã người dùng rút gọn thay vì bỏ trống. */
export function studentName(sub: Pick<ExerciseSubmissionRecord, "student" | "user_id">): string {
  return sub.student?.full_name?.trim() || `Học viên ${sub.user_id.slice(0, 8)}`;
}
