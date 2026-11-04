import type { LessonCodeHistoryItem } from "@/services/lesson-code.service";

/** Phần tối thiểu của một lượt nộp để xét đạt. */
export interface GradedSubmission {
  score: number;
  total: number;
}

export function isPassingSubmission(s: GradedSubmission | null | undefined, passPercentage: number): boolean {
  return !!s && s.total > 0 && s.score >= passPercentage;
}

/**
 * Học viên đã có MỘT lượt nộp đạt thì được đánh dấu hoàn thành, dù lượt nộp gần nhất sau đó trượt
 * (QA3 Q15: trước đây chỉ xét lượt gần nhất nên Accepted 100/100 rồi nộp thử lại sai là mất nút).
 * Xét lượt gần nhất cộng với lịch sử đã tải.
 */
export function hasPassingSubmission(
  last: GradedSubmission | null | undefined,
  history: ReadonlyArray<LessonCodeHistoryItem> | undefined,
  passPercentage: number
): boolean {
  return isPassingSubmission(last, passPercentage) || (history ?? []).some((h) => isPassingSubmission(h, passPercentage));
}
