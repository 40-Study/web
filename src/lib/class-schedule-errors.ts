import { ApiError } from "@/lib/errors";
import { HAS_VIETNAMESE_DIACRITICS, getErrorMessage } from "@/lib/error-messages";

/** Nơi lỗi phát sinh: cùng một 409 nghĩa khác nhau khi sinh buổi hàng loạt. */
export type ScheduleErrorContext = "schedule" | "session" | "generate";

const OVERLAP_MESSAGE = "Lịch bị trùng với một buổi học khác của lớp hoặc của giảng viên lớp. Hãy chọn thời gian khác.";
const GENERATE_NOTHING_NEW_MESSAGE =
  "Không có buổi mới để tạo: các buổi trong khoảng ngày này đã tồn tại hoặc bị trùng giờ với buổi học khác.";

// Backend trả các câu tiếng Anh này (400) ở schedule_service.go; bảng chung của error-messages.ts không có,
// nên không map thì giáo viên chỉ thấy câu "Yêu cầu không hợp lệ" mà không biết phải làm gì.
const BACKEND_MESSAGES: Record<string, string> = {
  "no recurring schedules found for this class": "Lớp chưa có lịch học hằng tuần. Hãy thêm lịch học trước khi sinh buổi học.",
  "no sessions generated for the given date range": "Không có ngày nào trong khoảng này khớp với lịch học hằng tuần đang áp dụng.",
  "date range for generating sessions is too long": "Chỉ sinh buổi học trong tối đa 1 năm mỗi lần.",
};

/**
 * Câu tiếng Việt cho lỗi của API lịch học/buổi học. 409 trùng giờ được nói rõ kèm chi tiết backend
 * (câu đã là tiếng Việt: "buổi học trùng giờ với một buổi khác…"); lớp lưu trữ (409 CLASS_ARCHIVED) và mọi lỗi
 * khác đi qua bảng chung `getErrorMessage`.
 */
export function describeScheduleError(error: unknown, context: ScheduleErrorContext = "schedule"): string {
  if (error instanceof ApiError) {
    const known = BACKEND_MESSAGES[error.message.trim().toLowerCase()];
    if (known) return known;
    if (error.status === 409 && error.code !== "CLASS_ARCHIVED") {
      if (context === "generate") return GENERATE_NOTHING_NEW_MESSAGE;
      const detail = HAS_VIETNAMESE_DIACRITICS.test(error.message) ? error.message.trim() : "";
      return detail ? `Trùng lịch: ${detail}. Hãy chọn thời gian khác.` : OVERLAP_MESSAGE;
    }
  }
  return getErrorMessage(error);
}
