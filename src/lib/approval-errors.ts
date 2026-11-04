/**
 * Thông điệp tiếng Việt cho lỗi duyệt khoá học / hồ sơ giáo viên (Phase 3).
 *
 * Backend trả `message` tiếng Anh ("Course is not pending review"...) — phân biệt bằng `code`
 * (không so chuỗi message, dễ vỡ khi backend đổi câu chữ). Lỗi không có code riêng: chỉ tin
 * message có dấu tiếng Việt, còn lại dùng fallback của nơi gọi.
 */

import { CONTRACT_CODE_MESSAGES } from "@/lib/contract-error-codes";
import { ApiError, ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";

export const COURSE_LESSON_NO_CONTENT_CODE = "COURSE_LESSON_NO_CONTENT";

export interface LessonWithoutContent {
  id: string;
  title: string;
}

/**
 * 422 COURSE_LESSON_NO_CONTENT (T6, QA 261008): khoá còn bài học chưa có nội dung. Trả danh sách bài
 * từ body (`lessons: [{id,title}]`); `null` nếu lỗi không phải loại này.
 */
export function lessonsWithoutContent(error: unknown): LessonWithoutContent[] | null {
  if (!(error instanceof ApiError) || error.code !== COURSE_LESSON_NO_CONTENT_CODE) return null;
  const raw = error instanceof ValidationError ? error.payload?.lessons : undefined;
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const { id, title } = (item ?? {}) as { id?: unknown; title?: unknown };
    return typeof title === "string" && title.trim()
      ? [{ id: typeof id === "string" ? id : title, title }]
      : [];
  });
}

const CODE_MESSAGES: Record<string, string> = {
  INVALID_COURSE_STATUS:
    "Trạng thái khoá học đã thay đổi (có thể đã được xử lý). Vui lòng tải lại trang.",
  COURSE_STATUS_CHANGE_NOT_ALLOWED:
    "Không thể đổi trạng thái trực tiếp — hãy dùng chức năng gửi duyệt.",
  // QA vòng 2 (D2, Q5)
  COURSE_EMPTY: "Khoá học cần có ít nhất 1 bài học trước khi gửi duyệt.",
  // T6 (QA 261008): danh sách bài thiếu nội dung hiển thị riêng (lessonsWithoutContent).
  COURSE_LESSON_NO_CONTENT: "Mọi bài học cần có nội dung trước khi gửi duyệt.",
  COURSE_PENDING_REVIEW:
    "Khoá học đang chờ duyệt nên không thể chỉnh sửa hay xoá. Hãy rút yêu cầu duyệt trước.",
  // Smoke2 Q2-01b: xoá khoá còn học viên -> gợi ý Lưu trữ (nút ở useDeleteCourse).
  COURSE_HAS_ENROLLMENTS:
    "Khoá học đã có học viên đăng ký nên không thể xoá. Hãy lưu trữ để ngừng bán mà không ảnh hưởng học viên.",
  // L1: backend từ chối giá khuyến mãi <= 0 hoặc >= giá bán (tạo và sửa khoá).
  DISCOUNT_PRICE_INVALID:
    "Giá khuyến mãi phải lớn hơn 0 và thấp hơn giá bán. Muốn bỏ khuyến mãi, hãy để trống ô giá khuyến mãi.",
  APPLICATION_NOT_PENDING: "Hồ sơ không còn ở trạng thái chờ duyệt. Vui lòng tải lại trang.",
  APPLICATION_NOT_REJECTED: "Chỉ có thể nộp lại hồ sơ đang bị từ chối.",
  RESUBMISSION_LIMIT_REACHED:
    "Bạn đã nộp lại quá 3 lần. Vui lòng liên hệ bộ phận hỗ trợ.",
};

const HAS_VIETNAMESE_DIACRITICS = /[à-ỹÀ-Ỹ]/;

export const COURSE_INCOMPLETE_CODE = "COURSE_INCOMPLETE";
export const PAID_COURSE_PRICE_INVALID_CODE = "PAID_COURSE_PRICE_INVALID";

/** Tên gọi tiếng Việt của các mục `missing[]` trong 422 COURSE_INCOMPLETE (backend gửi tên field). */
const COURSE_MISSING_FIELD_LABEL: Record<string, string> = {
  thumbnail_url: "ảnh bìa",
  description: "mô tả",
  price: "giá bán",
};

/** Mục còn thiếu của 422 COURSE_INCOMPLETE (đã dịch, bỏ mục lạ); `null` nếu lỗi không phải loại này. */
export function missingCourseFields(error: unknown): string[] | null {
  if (!(error instanceof ApiError) || error.code !== COURSE_INCOMPLETE_CODE) return null;
  const raw = error instanceof ValidationError ? error.payload?.missing : undefined;
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const label = typeof item === "string" ? COURSE_MISSING_FIELD_LABEL[item] : undefined;
    return label ? [label] : [];
  });
}

function courseIncompleteMessage(error: unknown): string {
  const missing = missingCourseFields(error) ?? [];
  const base = "Khoá học chưa đủ thông tin để gửi duyệt.";
  return missing.length > 0 ? `${base} Còn thiếu: ${missing.join(", ")}.` : base;
}

export function approvalErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ForbiddenError) return "Bạn không có quyền thực hiện thao tác này.";
  if (error instanceof NotFoundError) return "Không tìm thấy dữ liệu — có thể đã bị xoá.";
  if (error instanceof ApiError) {
    if (error.code === COURSE_INCOMPLETE_CODE) return courseIncompleteMessage(error);
    // Giá khoá có phí: câu của backend đã nói đúng lỗi, câu dưới đây chỉ là dự phòng.
    if (error.code === PAID_COURSE_PRICE_INVALID_CODE) {
      return HAS_VIETNAMESE_DIACRITICS.test(error.message)
        ? error.message
        : CONTRACT_CODE_MESSAGES[PAID_COURSE_PRICE_INVALID_CODE];
    }
    const mapped = CODE_MESSAGES[error.code];
    if (mapped) return mapped;
    if (error.message && HAS_VIETNAMESE_DIACRITICS.test(error.message)) return error.message;
  }
  return fallback;
}
