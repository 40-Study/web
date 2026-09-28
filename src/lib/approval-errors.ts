/**
 * Thông điệp tiếng Việt cho lỗi duyệt khoá học / hồ sơ giáo viên (Phase 3).
 *
 * Backend trả `message` tiếng Anh ("Course is not pending review"...) — phân biệt bằng `code`
 * (không so chuỗi message, dễ vỡ khi backend đổi câu chữ). Lỗi không có code riêng: chỉ tin
 * message có dấu tiếng Việt, còn lại dùng fallback của nơi gọi.
 */

import { ApiError, ForbiddenError, NotFoundError } from "@/lib/errors";

const CODE_MESSAGES: Record<string, string> = {
  INVALID_COURSE_STATUS:
    "Trạng thái khoá học đã thay đổi (có thể đã được xử lý). Vui lòng tải lại trang.",
  COURSE_STATUS_CHANGE_NOT_ALLOWED:
    "Không thể đổi trạng thái trực tiếp — hãy dùng chức năng gửi duyệt.",
  // QA vòng 2 (D2, Q5)
  COURSE_EMPTY: "Khoá học cần có ít nhất 1 bài học trước khi gửi duyệt.",
  COURSE_PENDING_REVIEW:
    "Khoá học đang chờ duyệt nên không thể chỉnh sửa. Hãy rút yêu cầu duyệt trước.",
  APPLICATION_NOT_PENDING: "Hồ sơ không còn ở trạng thái chờ duyệt. Vui lòng tải lại trang.",
  APPLICATION_NOT_REJECTED: "Chỉ có thể nộp lại hồ sơ đang bị từ chối.",
  RESUBMISSION_LIMIT_REACHED:
    "Bạn đã nộp lại quá 3 lần. Vui lòng liên hệ bộ phận hỗ trợ.",
};

const HAS_VIETNAMESE_DIACRITICS = /[à-ỹÀ-Ỹ]/;

export function approvalErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ForbiddenError) return "Bạn không có quyền thực hiện thao tác này.";
  if (error instanceof NotFoundError) return "Không tìm thấy dữ liệu — có thể đã bị xoá.";
  if (error instanceof ApiError) {
    const mapped = CODE_MESSAGES[error.code];
    if (mapped) return mapped;
    if (error.message && HAS_VIETNAMESE_DIACRITICS.test(error.message)) return error.message;
  }
  return fallback;
}
