import type { JudgeResult } from "./types";

/**
 * Nhãn tiếng Việt cho trạng thái Judge0, theo `status.id` (ổn định hơn chuỗi mô tả tiếng Anh).
 * "Được chấp nhận" / "Sai đáp án" khớp bản dịch ở trang bài tập (exercise-lesson-content).
 * 7-12 là các biến thể Runtime Error (SIGSEGV, SIGXFSZ, SIGFPE, SIGABRT, NZEC, Other) — gộp một nhãn.
 */
const JUDGE_STATUS_VI: Record<number, string> = {
  1: "Trong hàng đợi",
  2: "Đang xử lý",
  3: "Được chấp nhận",
  4: "Sai đáp án",
  5: "Vượt quá thời gian",
  6: "Lỗi biên dịch",
  7: "Lỗi khi chạy",
  8: "Lỗi khi chạy",
  9: "Lỗi khi chạy",
  10: "Lỗi khi chạy",
  11: "Lỗi khi chạy",
  12: "Lỗi khi chạy",
  13: "Lỗi hệ thống",
  14: "Lỗi định dạng thực thi",
};

/** Trạng thái lạ (id chưa biết) giữ nguyên chuỗi gốc của Judge0 để không che mất thông tin. */
export function translateJudgeStatus(status: JudgeResult["status"]): string {
  if (!status) return "";
  return JUDGE_STATUS_VI[status.id] ?? status.description;
}