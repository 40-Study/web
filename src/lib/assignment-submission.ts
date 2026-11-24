/**
 * Trạng thái bài nộp của chính học viên trên danh sách "Bài tập của tôi" (QA5 S5-02).
 * Nguồn: `my_submission` trong item của `GET /assignments` (backend cũ không trả: coi như chưa nộp).
 */

import type { MySubmissionSummary } from "@/services/assignment.service";

const scoreFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

export function hasSubmitted(a: { my_submission?: MySubmissionSummary | null }): boolean {
  return !!a.my_submission;
}

/** "Đã chấm 9/10" khi đã có điểm, "Đã nộp" khi đang chờ chấm; `null` khi chưa nộp. */
export function submissionLabel(sub: MySubmissionSummary | null | undefined): string | null {
  if (!sub) return null;
  if (typeof sub.score !== "number") return "Đã nộp";
  const score = scoreFormat.format(sub.score);
  return typeof sub.max_score === "number" && sub.max_score > 0
    ? `Đã chấm ${score}/${scoreFormat.format(sub.max_score)}`
    : `Đã chấm ${score}`;
}
