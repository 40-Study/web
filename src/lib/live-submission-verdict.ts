/**
 * Verdict của bài nộp bài tập buổi live/bài tập lớp (bảng `submissions`, route `/submissions`).
 * Dùng chung cho màn làm bài của học viên (AssignmentWorkOverlay) và màn chấm của giáo viên,
 * để không có verdict nào hiện ra thô / không nhãn.
 */
import type { SubmissionVerdict } from "@/services/submission.service";

export const SUBMISSION_VERDICT_LABELS: Record<SubmissionVerdict, string> = {
  pending: "Đang chờ chấm tự động",
  running: "Đang chạy",
  accepted: "Đạt toàn bộ test",
  wrong_answer: "Sai kết quả",
  time_limit_exceeded: "Quá thời gian",
  memory_limit_exceeded: "Quá bộ nhớ",
  runtime_error: "Lỗi khi chạy",
  compilation_error: "Lỗi biên dịch",
  system_error: "Máy chấm không sẵn sàng (chưa tính)",
};

/** Câu cho học viên khi bài nộp kết thúc với `system_error` (backend#138: máy chấm sập, bài không được tính). */
export const JUDGE_UNAVAILABLE_SUBMIT_AGAIN_MESSAGE =
  "Máy chấm đang không sẵn sàng. Bài nộp chưa được tính, hãy nộp lại.";

export function submissionVerdictLabel(verdict: string): string {
  return SUBMISSION_VERDICT_LABELS[verdict as SubmissionVerdict] ?? verdict;
}

/** Backend chấm nền (POST /submissions trả 201 + dòng `pending`); còn đang chấm thì chưa có kết quả. */
export function isGradingVerdict(verdict: unknown): boolean {
  return verdict === "pending" || verdict === "running";
}

/** `system_error` không phải kết quả về code của học viên: bài nộp không được tính. */
export function isJudgeUnavailableVerdict(verdict: unknown): boolean {
  return verdict === "system_error";
}
