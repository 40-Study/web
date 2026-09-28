/**
 * Thông điệp tiếng Việt cho lỗi API quản lý cuộc thi (bảng mã contract §2.4).
 *
 * Vì sao cần hàm riêng:
 *  - `api-client` chuẩn hoá 403 → `ForbiddenError` và 404 → `NotFoundError`, LÀM MẤT `code` backend
 *    (chỉ giữ `message`). Với cuộc thi, message nghiệp vụ backend đã là tiếng Việt ("Bạn không có
 *    quyền với cuộc thi này") nên tin message có dấu; còn 403 từ middleware quyền trả tiếng Anh
 *    ("Insufficient permissions") → rơi về câu tiếng Việt cố định.
 *  - 400/409 giữ nguyên `code` (`ApiError`) → tra bảng, KHÔNG so chuỗi message (dễ vỡ khi backend
 *    đổi câu chữ). "Validation failed" (400 không có code) là tiếng Anh → câu chung tiếng Việt.
 */

import { ApiError, ForbiddenError, NetworkError, NotFoundError, RateLimitError } from "@/lib/errors";

export const CONTEST_ERROR_MESSAGES: Record<string, string> = {
  INVALID_ID: "Mã cuộc thi không hợp lệ.",
  CONTEST_INVALID_SCHEDULE:
    "Lịch chưa hợp lệ: giờ bắt đầu phải ở tương lai và giờ kết thúc phải sau giờ bắt đầu cộng thời lượng làm bài.",
  CONTEST_QUIZ_INVALID:
    "Bài trắc nghiệm chưa đủ điều kiện: cần ít nhất 1 câu, không có câu tự luận, chưa ai làm và không gắn với bài học/khoá học.",
  CONTEST_PRIZES_INVALID:
    "Cơ cấu giải chưa hợp lệ: hạng từ 1 đến 100, các khoảng hạng không chồng nhau, tối đa 10 giải và mỗi giải phải có chứng nhận hoặc voucher.",
  REASON_REQUIRED: "Vui lòng nhập lý do.",
  REASON_TOO_LONG: "Lý do tối đa 1000 ký tự.",
  CONTEST_FORBIDDEN: "Bạn không có quyền với cuộc thi này.",
  CONTEST_VOUCHER_ADMIN_ONLY: "Chỉ quản trị viên được gắn giải voucher.",
  CONTEST_NOT_FOUND: "Không tìm thấy cuộc thi (có thể đã bị xoá hoặc bạn không phải người tạo).",
  CONTEST_INVALID_STATUS:
    "Trạng thái cuộc thi đã thay đổi nên không thể thực hiện thao tác này. Vui lòng tải lại trang.",
  CONTEST_START_PASSED: "Đã qua giờ bắt đầu cuộc thi. Hãy sửa lại lịch trước khi gửi duyệt hoặc duyệt.",
  CONTEST_QUIZ_IN_USE: "Bài trắc nghiệm này đã được gắn với một cuộc thi khác.",
  CONTEST_QUIZ_LOCKED:
    "Bài trắc nghiệm đang dùng cho cuộc thi đã gửi duyệt, đã công bố hoặc đã huỷ nên không thể sửa.",
  CONTEST_NOT_ENDED: "Chỉ có thể chốt kết quả sau khi cuộc thi kết thúc ít nhất 60 giây.",
  CONTEST_VOUCHER_UNAVAILABLE:
    "Voucher của giải không còn dùng được (đã tắt, bị xoá hoặc hết hạn). Hãy chọn voucher khác.",
};

const HAS_VIETNAMESE_DIACRITICS = /[à-ỹÀ-Ỹ]/;

export function contestErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof RateLimitError || error instanceof NetworkError) return error.message;
  if (error instanceof ApiError) {
    const mapped = CONTEST_ERROR_MESSAGES[error.code];
    if (mapped) return mapped;
    if (error.message && HAS_VIETNAMESE_DIACRITICS.test(error.message)) return error.message;
    if (error instanceof ForbiddenError) return "Bạn không có quyền thực hiện thao tác này.";
    if (error instanceof NotFoundError) return CONTEST_ERROR_MESSAGES.CONTEST_NOT_FOUND;
    if (error.status === 400) return "Dữ liệu chưa hợp lệ, vui lòng kiểm tra lại các trường đã nhập.";
  }
  return fallback;
}
