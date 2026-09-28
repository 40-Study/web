/**
 * Thông điệp tiếng Việt cho lỗi "Cuộc thi" (contract §2.4).
 *
 * Backend trả `message` tiếng Anh; phân biệt bằng `code`, không so chuỗi message (đổi câu chữ là
 * vỡ). Bảng ánh xạ là `Record<ContestErrorCode, string>` để khi contract thêm mã mới mà quên dịch
 * thì `tsc` báo lỗi ngay, không lặng lẽ rơi về câu chung chung.
 */
import { ApiError, NetworkError, RateLimitError } from "@/lib/errors";
import type { ContestErrorCode } from "@/types/contest";

export const CONTEST_ERROR_MESSAGES: Record<ContestErrorCode, string> = {
  INVALID_ID: "Đường dẫn cuộc thi không hợp lệ.",
  CONTEST_INVALID_SCHEDULE: "Lịch thi không hợp lệ.",
  CONTEST_QUIZ_INVALID: "Bộ câu hỏi của cuộc thi không hợp lệ.",
  CONTEST_PRIZES_INVALID: "Cơ cấu giải thưởng không hợp lệ.",
  REASON_REQUIRED: "Vui lòng nhập lý do.",
  REASON_TOO_LONG: "Lý do quá dài (tối đa 1000 ký tự).",
  CONTEST_FORBIDDEN: "Bạn không có quyền thực hiện thao tác này với cuộc thi.",
  CONTEST_ROLE_NOT_ALLOWED: "Chỉ học viên mới được tham gia cuộc thi.",
  CONTEST_OWNER_CANNOT_JOIN: "Người tạo cuộc thi không thể tự tham gia.",
  CONTEST_COURSE_REQUIRED: "Cuộc thi này chỉ dành cho học viên đã mua khoá học liên kết.",
  CONTEST_VOUCHER_ADMIN_ONLY: "Chỉ quản trị viên được gắn giải voucher.",
  CONTEST_NOT_JOINED: "Bạn chưa đăng ký cuộc thi này.",
  CONTEST_LEADERBOARD_HIDDEN: "Bảng xếp hạng chỉ công bố sau khi cuộc thi kết thúc.",
  QUIZ_LOCKED_BY_CONTEST: "Bộ câu hỏi đang được dùng cho một cuộc thi.",
  CONTEST_NOT_FOUND: "Không tìm thấy cuộc thi, hoặc cuộc thi chưa được công bố.",
  CONTEST_RESULT_NOT_FOUND: "Bạn chưa nộp bài trong cuộc thi này nên chưa có kết quả.",
  CONTEST_CERTIFICATE_NOT_FOUND: "Bạn không có chứng nhận cho cuộc thi này.",
  CONTEST_INVALID_STATUS: "Trạng thái cuộc thi đã thay đổi. Vui lòng tải lại trang.",
  CONTEST_START_PASSED: "Đã qua giờ bắt đầu cuộc thi.",
  CONTEST_QUIZ_IN_USE: "Bộ câu hỏi đã được gắn với một cuộc thi khác.",
  CONTEST_QUIZ_LOCKED: "Không thể sửa bộ câu hỏi khi cuộc thi đang chờ duyệt hoặc đã công bố.",
  CONTEST_CLOSED: "Cuộc thi đã đóng đăng ký.",
  CONTEST_NOT_ACTIVE: "Cuộc thi chưa mở hoặc đã kết thúc, chưa thể bắt đầu làm bài.",
  CONTEST_ALREADY_JOINED: "Bạn đã đăng ký cuộc thi này rồi.",
  CONTEST_FULL: "Cuộc thi đã đủ số người tham gia.",
  CONTEST_ALREADY_SUBMITTED: "Bạn đã nộp bài rồi, mỗi người chỉ được nộp một lần.",
  CONTEST_DEADLINE_PASSED: "Đã hết thời gian làm bài, bài làm không được tính.",
  CONTEST_ATTEMPT_MISMATCH: "Phiên làm bài không khớp. Vui lòng tải lại trang.",
  CONTEST_NOT_ENDED: "Cuộc thi chưa kết thúc nên chưa thể chốt kết quả.",
  CONTEST_VOUCHER_UNAVAILABLE: "Voucher của giải thưởng không còn dùng được.",
};

const GENERIC_MESSAGE = "Có lỗi xảy ra, vui lòng thử lại.";

function isKnownCode(code: string): code is ContestErrorCode {
  return Object.prototype.hasOwnProperty.call(CONTEST_ERROR_MESSAGES, code);
}

/** Lỗi bất kỳ → một câu tiếng Việt hiển thị được cho người dùng. */
export function contestErrorMessage(error: unknown, fallback = GENERIC_MESSAGE): string {
  if (error instanceof RateLimitError) return error.message;
  if (error instanceof NetworkError) return GENERIC_MESSAGE;
  if (error instanceof ApiError) {
    if (isKnownCode(error.code)) return CONTEST_ERROR_MESSAGES[error.code];
    if (error.status === 401) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    if (error.status === 403) return "Bạn không có quyền thực hiện thao tác này.";
    if (error.status === 404) return "Không tìm thấy dữ liệu.";
    if (error.code === "VALIDATION_FAILED") return "Dữ liệu gửi lên không hợp lệ.";
  }
  return fallback;
}

/** Mã lỗi nghiệp vụ (nếu có) — để màn hình rẽ nhánh (vd hết giờ → về trang kết quả). */
export function contestErrorCode(error: unknown): string | null {
  return error instanceof ApiError ? error.code : null;
}
