import type { JudgeResult } from "./types";

/**
 * Nhãn tiếng Việt cho trạng thái Judge0, theo `status.id` (ổn định hơn chuỗi mô tả tiếng Anh).
 * "Được chấp nhận" / "Sai đáp án" khớp bản dịch ở trang bài tập (exercise-lesson-content).
 * 7-12 là các biến thể Runtime Error (SIGSEGV, SIGXFSZ, SIGFPE, SIGABRT, NZEC, Other), mỗi loại một nhãn để người học biết nguyên nhân.
 */
const JUDGE_STATUS_VI: Record<number, string> = {
  1: "Trong hàng đợi",
  2: "Đang xử lý",
  3: "Được chấp nhận",
  4: "Sai đáp án",
  5: "Vượt quá thời gian",
  6: "Lỗi biên dịch",
  7: "Lỗi khi chạy (tràn bộ nhớ đoạn)", // SIGSEGV
  8: "Lỗi khi chạy (vượt quá kích thước tệp)", // SIGXFSZ
  9: "Lỗi khi chạy (lỗi phép tính số học)", // SIGFPE
  10: "Lỗi khi chạy (chương trình tự huỷ)", // SIGABRT
  11: "Lỗi khi chạy (mã thoát khác 0)", // NZEC
  12: "Lỗi khi chạy (lỗi khác)", // Other
  13: "Lỗi hệ thống",
  14: "Lỗi định dạng thực thi",
};

/** Trạng thái lạ (id chưa biết) giữ nguyên chuỗi gốc của Judge0 để không che mất thông tin. */
export function translateJudgeStatus(status: JudgeResult["status"]): string {
  if (!status) return "";
  return JUDGE_STATUS_VI[status.id] ?? status.description;
}